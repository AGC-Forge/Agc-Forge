import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { puterTxt2Img } from "@/lib/ai/puter-client";
import { uploadFromUrl } from "@/lib/minio";
import { setJobProgress } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 menit untuk generate image

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: ImageGenConfig & {
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
    quality,
  } = body;

  if (!conversationId || !prompt || !model_id) {
    return NextResponse.json(
      { error: "conversationId, prompt, model_id are required fields" },
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

  // ── Buat user message (jika belum ada) ───────────────────────────────────
  let userMsgId = messageId;
  if (!userMsgId) {
    const userMsg = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        role: "USER",
        content: prompt,
        model_id: model_id,
      },
    });
    userMsgId = userMsg.id;
  }

  // ── Buat assistant message placeholder ───────────────────────────────────
  const assistantMessage = await prisma.message.create({
    data: {
      conversation_id: conversationId,
      role: "ASSISTANT",
      content: `Generating image: "${prompt.slice(0, 80)}..."`,
      model_id: model_id,
    },
  });

  // ── Buat GenJob record ────────────────────────────────────────────────────
  const genJob = await prisma.genJob.create({
    data: {
      conversation_id: conversationId,
      message_id: assistantMessage.id,
      job_type: "IMAGE",
      status: "PENDING",
      provider,
      model_id,
      prompt,
      aspect_ratio: aspect_ratio ?? "16:9",
      quality: quality ?? "2K",
      progress: 0,
    },
  });

  // ── Update conversation ───────────────────────────────────────────────────
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { last_message_at: new Date() },
  });

  // ── Jalankan generate secara async (non-blocking response) ───────────────
  // Return job ID dulu, proses berjalan di background
  const jobId = genJob.id;

  // Jalankan async tanpa await
  generateImageAsync({
    jobId,
    prompt,
    model_id,
    quality,
    userId: session.user.id,
    conversationId,
    assistantMessageId: assistantMessage.id,
  }).catch((err) => {
    console.error("[Image Gen] Background error:", err);
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId,
      message: "Image generation started. Check status via /api/ai/status/[jobId]",
    },
  });
}

// ── Background generate function ──────────────────────────────────────────────

async function generateImageAsync(params: {
  jobId: string;
  prompt: string;
  model_id: string;
  quality?: string;
  userId: string;
  conversationId: string;
  assistantMessageId: string;
}) {
  const { jobId, prompt, model_id, quality, userId, conversationId, assistantMessageId } = params;

  try {
    // Update: PROCESSING
    await Promise.all([
      prisma.genJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", progress: 10, started_at: new Date() },
      }),
      setJobProgress(jobId, { status: "PROCESSING", progress: 10 }),
    ]);

    // ── Call Puter txt2img ──────────────────────────────────────────────────
    await setJobProgress(jobId, { status: "PROCESSING", progress: 30 });

    const result = await puterTxt2Img({
      prompt,
      model: model_id,
      testMode: process.env.NODE_ENV === "development" && process.env.PUTER_TEST_MODE === "true",
    });

    await setJobProgress(jobId, { status: "PROCESSING", progress: 70 });

    // ── Upload hasil ke MinIO ──────────────────────────────────────────────
    let minioResult;
    try {
      minioResult = await uploadFromUrl({
        url: result.url,
        userId,
        folder: "generated",
        mimeType: "image/png",
      });
    } catch (uploadErr) {
      console.error("[Image Gen] MinIO upload error:", uploadErr);
      // Fallback: gunakan URL langsung dari Puter
      minioResult = {
        bucket: "puter-direct",
        object_key: result.url,
        url: result.url,
        filename: `generated-${jobId}.png`,
        original_filename: `generated-${jobId}.png`,
        size: 0,
        mime_type: "image/png",
        type: "IMAGE" as const,
      };
    }

    await setJobProgress(jobId, { status: "PROCESSING", progress: 90 });

    // ── Simpan Media ke DB ─────────────────────────────────────────────────
    const media = await prisma.media.create({
      data: {
        message_id: assistantMessageId,
        bucket: minioResult.bucket,
        object_key: minioResult.object_key,
        url: minioResult.url,
        type: "IMAGE",
        filename: minioResult.filename,
        original_filename: minioResult.original_filename,
        size: minioResult.size,
        mime_type: "image/png",
        gen_prompt: prompt,
        gen_model_id: model_id,
        is_generated: true,
      },
    });

    // ── Update message content ─────────────────────────────────────────────
    await prisma.message.update({
      where: { id: assistantMessageId },
      data: { content: `Image generated from prompt: "${prompt.slice(0, 80)}"` },
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

    console.log(`[Image Gen] Job ${jobId} completed.`);
  } catch (err: any) {
    console.error(`[Image Gen] Job ${jobId} failed:`, err);

    const errorMsg = err.message ?? "Image generation failed";

    await Promise.all([
      prisma.genJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error_message: errorMsg,
          completed_at: new Date(),
        },
      }),
      prisma.message.update({
        where: { id: assistantMessageId },
        data: {
          content: `Image generation failed: ${errorMsg}`,
          is_error: true,
        },
      }),
      setJobProgress(jobId, {
        status: "FAILED",
        progress: 0,
        error_message: errorMsg,
      }),
    ]);
  }
}
