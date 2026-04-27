import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { puterChatStream } from "@/lib/ai/puter-client";
import { processFileForAI, buildMessagesWithFiles } from "@/lib/ai/file-processor";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 menit max untuk streaming

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    conversationId: string;
    content: string;
    model: string;
    provider: string;
    history?: Array<{ role: string; content: string }>;
    mediaUrls?: Array<{ url: string; filename: string; mimeType: string }>;
    systemPrompt?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    conversationId,
    content,
    model,
    provider,
    history = [],
    mediaUrls = [],
    systemPrompt,
  } = body;

  if (!conversationId || !content || !model) {
    return NextResponse.json({ error: "conversationId, content, model are required fields" }, { status: 400 });
  }

  // ── Verifikasi conversation milik user ────────────────────────────────────
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: { project: { select: { system_prompt: true } } },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // ── Simpan user message ke DB ─────────────────────────────────────────────
  const userMessage = await prisma.message.create({
    data: {
      conversation_id: conversationId,
      role: "USER",
      content,
      model_id: model,
    },
  });

  // ── Update conversation last_message_at ───────────────────────────────────
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { last_message_at: new Date() },
  });

  // ── Proses file attachments ───────────────────────────────────────────────
  const processedFiles = await Promise.all(
    mediaUrls.map((f) => processFileForAI(f.url, f.filename, f.mimeType))
  );

  // ── Tentukan system prompt (project > param > default) ────────────────────
  const finalSystemPrompt =
    conversation.project?.system_prompt ||
    systemPrompt ||
    "You are an AI assistant that can help, be honest, and be accurate.";

  // ── Bangun messages array ─────────────────────────────────────────────────
  const messages = buildMessagesWithFiles({
    textContent: content,
    processedFiles,
    history: history.slice(-30), // max 30 messages history
    systemPrompt: finalSystemPrompt,
  });

  // ── Stream dari Puter API ─────────────────────────────────────────────────
  let puterResponse: Response;
  try {
    puterResponse = await puterChatStream({ model, messages });
  } catch (err: any) {
    console.error("[Chat API] Puter stream error:", err);

    // Simpan error message ke DB
    await prisma.message.create({
      data: {
        conversation_id: conversationId,
        role: "ASSISTANT",
        content: `Error: ${err.message ?? "AI connection failed"}`,
        model_id: model,
        is_error: true,
      },
    });

    return NextResponse.json(
      { error: err.message ?? "AI connection failed" },
      { status: 502 }
    );
  }

  // ── Transform stream: collect + save ke DB setelah selesai ───────────────
  let fullContent = "";
  let totalTokens = 0;
  const assistantMessageId = crypto.randomUUID();

  // Pre-create assistant message placeholder
  const assistantMessage = await prisma.message.create({
    data: {
      id: assistantMessageId,
      conversation_id: conversationId,
      role: "ASSISTANT",
      content: "",
      model_id: model,
    },
  });

  // Transform stream: pass-through ke client + collect content
  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    async transform(chunk, controller) {
      controller.enqueue(chunk);

      // Parse SSE chunks untuk collect full content
      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          // OpenAI format
          const delta =
            parsed.choices?.[0]?.delta?.content ??
            // Anthropic format (via Puter)
            parsed.delta?.text ??
            "";
          if (delta) fullContent += delta;

          // Collect token usage jika ada
          if (parsed.usage) {
            totalTokens = parsed.usage.total_tokens ?? 0;
          }
        } catch { }
      }
    },

    async flush() {
      // Stream selesai — update assistant message di DB
      if (fullContent) {
        await prisma.message.update({
          where: { id: assistantMessageId },
          data: {
            content: fullContent,
            tokens_used: totalTokens || null,
          },
        });

        // Update total tokens di conversation
        if (totalTokens > 0) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              total_tokens: {
                increment: totalTokens,
              },
            },
          });
        }
      }
    },
  });

  return new Response(puterResponse.body!.pipeThrough(transformStream), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // Disable Nginx buffering untuk SSE
      "Connection": "keep-alive",
    },
  });
}
