import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { puterTxt2Vid } from "@/lib/ai/puter-client";
import { uploadFromUrl } from "@/lib/minio";
import { setJobProgress } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 600; // 10 menit untuk generate video

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: VideoGenConfig & {
    conversationId: string;
    messageId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    conversationId,
    messageId,
    prompt,
    model_id,
    provider,
    aspect_ratio,
    resolution,
    duration,
    fps,
    extend_from_url,
    extend_from_media_id,
    extend_start_sec,
  } = body;

  if (!conversationId || !prompt || !model_id) {
    return NextResponse.json(
      { error: "conversationId, prompt, model_id is required" },
      { status: 400 }
    );
  }

  // ── Verifikasi conversation ───────────────────────────────────────────────
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found or not accessible" }, { status: 404 });
  }

  // ── Verifikasi source video untuk Extend Video ────────────────────────────
  let extendSourceUrl = extend_from_url;
  if (extend_from_media_id && !extendSourceUrl) {
    const sourceMedia = await prisma.media.findFirst({
      where: {
        id: extend_from_media_id,
        message: { conversation: { userId: session.user.id } },
      },
    });
    if (!sourceMedia) {
      return NextResponse.json({ error: "Source video not found or not accessible" }, { status: 404 });
    }
    extendSourceUrl = sourceMedia.url;
  }

  // ── Buat user message ─────────────────────────────────────────────────────
  let userMsgId = messageId;
  if (!userMsgId) {
    const isExtend = !!extendSourceUrl;
    const userMsg = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        role: "USER",
        content: isExtend
          ? `Extend video: "${prompt.slice(0, 80)}"`
          : prompt,
        model_id: model_id,
      },
    });
    userMsgId = userMsg.id;
  }

  // ── Buat assistant message placeholder ───────────────────────────────────
  const isExtend = !!extendSourceUrl;
  const assistantMessage = await prisma.message.create({
    data: {
      conversation_id: conversationId,
      role: "ASSISTANT",
      content: isExtend
        ? `Extending the video...`
        : `Generating video: "${prompt.slice(0, 80)}..."`,
      model_id: model_id,
    },
  });

  // ── Buat GenJob record ────────────────────────────────────────────────────
  const genJob = await prisma.genJob.create({
    data: {
      conversation_id: conversationId,
      message_id: assistantMessage.id,
      job_type: "VIDEO",
      status: "PENDING",
      provider,
      model_id,
      prompt,
      aspect_ratio: aspect_ratio ?? "16:9",
      resolution: resolution ?? "1080p",
      duration: duration ?? 10,
      fps: fps ?? 24,
      extend_from_media_id: extend_from_media_id ?? null,
      extend_from_url: extendSourceUrl ?? null,
      extend_start_sec: extend_start_sec ?? null,
      progress: 0,
    },
  });

  // ── Update conversation ───────────────────────────────────────────────────
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { last_message_at: new Date() },
  });

  const jobId = genJob.id;

  // ── Jalankan async ────────────────────────────────────────────────────────
  generateVideoAsync({
    jobId,
    prompt,
    model_id,
    duration: duration ?? 10,
    resolution: resolution ?? "1080p",
    extendSourceUrl,
    userId: session.user.id,
    conversationId,
    assistantMessageId: assistantMessage.id,
  }).catch((err) => {
    console.error("[Video Gen] Background error:", err);
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId,
      message: isExtend
        ? "Extend video process started. Check progress via /api/ai/status/[jobId]"
        : "Generate video process started. Check progress via /api/ai/status/[jobId]",
      estimatedDuration: `${(duration ?? 10) * 10} seconds`, // estimasi kasar
    },
  });
}

// ── Background generate function ──────────────────────────────────────────────

async function generateVideoAsync(params: {
  jobId: string;
  prompt: string;
  model_id: string;
  duration: number;
  resolution: string;
  extendSourceUrl?: string;
  userId: string;
  conversationId: string;
  assistantMessageId: string;
}) {
  const {
    jobId,
    prompt,
    model_id,
    duration,
    extendSourceUrl,
    userId,
    conversationId,
    assistantMessageId,
  } = params;

  // Progress simulation stages untuk video (lebih lama dari image)
  const progressStages = [10, 20, 35, 50, 65, 80, 90];

  try {
    // Update: PROCESSING
    await Promise.all([
      prisma.genJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", progress: 5, started_at: new Date() },
      }),
      setJobProgress(jobId, { status: "PROCESSING", progress: 5 }),
    ]);

    // Simulasi progress updates saat generate berjalan
    // (Puter tidak berikan callback progress, jadi kita simulasi)
    let stageIdx = 0;
    const progressInterval = setInterval(async () => {
      if (stageIdx < progressStages.length) {
        const p = progressStages[stageIdx++];
        await Promise.all([
          prisma.genJob.update({ where: { id: jobId }, data: { progress: p } }),
          setJobProgress(jobId, { status: "PROCESSING", progress: p }),
        ]);
      }
    }, Math.round((duration * 1000 * 10) / progressStages.length)); // distribusi merata

    // ── Call Puter txt2vid ──────────────────────────────────────────────────
    // Untuk extend video: tambahkan instruksi ke prompt
    const finalPrompt = extendSourceUrl
      ? `[Continue from existing video at: ${extendSourceUrl}] ${prompt}`
      : prompt;

    const result = await puterTxt2Vid({
      prompt: finalPrompt,
      model: model_id,
      testMode: process.env.NODE_ENV === "development" && process.env.PUTER_TEST_MODE === "true",
    });

    clearInterval(progressInterval);

    await setJobProgress(jobId, { status: "PROCESSING", progress: 92 });

    // ── Upload hasil ke MinIO ──────────────────────────────────────────────
    let minioResult;
    try {
      minioResult = await uploadFromUrl({
        url: result.url,
        userId,
        folder: "generated-videos",
        mimeType: "video/mp4",
      });
    } catch (uploadErr) {
      console.error("[Video Gen] MinIO upload error:", uploadErr);
      minioResult = {
        bucket: "puter-direct",
        object_key: result.url,
        url: result.url,
        filename: `video-${jobId}.mp4`,
        original_filename: `video-${jobId}.mp4`,
        size: 0,
        mime_type: "video/mp4",
        type: "VIDEO" as const,
      };
    }

    await setJobProgress(jobId, { status: "PROCESSING", progress: 97 });

    // ── Simpan Media ke DB ─────────────────────────────────────────────────
    const media = await prisma.media.create({
      data: {
        message_id: assistantMessageId,
        bucket: minioResult.bucket,
        object_key: minioResult.object_key,
        url: minioResult.url,
        type: "VIDEO",
        filename: minioResult.filename,
        original_filename: minioResult.original_filename,
        size: minioResult.size,
        mime_type: "video/mp4",
        gen_prompt: prompt,
        gen_model_id: model_id,
        gen_duration: duration,
        is_generated: true,
      },
    });

    // ── Update message ─────────────────────────────────────────────────────
    await prisma.message.update({
      where: { id: assistantMessageId },
      data: {
        content: extendSourceUrl
          ? `Video extended from prompt: "${prompt.slice(0, 80)}"`
          : `Video generated from prompt: "${prompt.slice(0, 80)}"`,
      },
    });

    // ── Update GenJob: COMPLETED ───────────────────────────────────────────
    await prisma.genJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        result_url: minioResult.url,
        result_media_id: media.id,
        completed_at: new Date(),
      },
    });

    await setJobProgress(jobId, {
      status: "COMPLETED",
      progress: 100,
      result_url: minioResult.url,
    });

    console.log(`[Video Gen] Job ${jobId} completed.`);
  } catch (err: any) {
    console.error(`[Video Gen] Job ${jobId} failed:`, err);
    const errorMsg = err.message ?? "Generate video failed";

    await Promise.all([
      prisma.genJob.update({
        where: { id: jobId },
        data: { status: "FAILED", error_message: errorMsg, completed_at: new Date() },
      }),
      prisma.message.update({
        where: { id: assistantMessageId },
        data: { content: `Failed to generate video: ${errorMsg}`, is_error: true },
      }),
      setJobProgress(jobId, { status: "FAILED", progress: 0, error_message: errorMsg }),
    ]);
  }
}
