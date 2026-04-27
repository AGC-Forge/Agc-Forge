import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { puterChatStream } from "@/lib/ai/puter-client";
import { processFileForAI, buildMessagesWithFiles } from "@/lib/ai/file-processor";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 menit max untuk streaming

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ error: "conversationId, content, model are required" }, { status: 400 });
  }

  // Verifikasi conversation milik user
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: { project: { select: { system_prompt: true } } },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Simpan user message
  await prisma.message.create({
    data: {
      conversation_id: conversationId,
      role: "USER",
      content,
      model_id: model,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { last_message_at: new Date() },
  });

  // Proses file attachments
  const processedFiles = await Promise.all(
    mediaUrls.map((f) => processFileForAI(f.url, f.filename, f.mimeType))
  );

  const finalSystemPrompt =
    conversation.project?.system_prompt ||
    systemPrompt ||
    "You are an AI assistant who is helpful, honest, and accurate.";

  const messages = buildMessagesWithFiles({
    textContent: content,
    processedFiles,
    history: history.slice(-30),
    systemPrompt: finalSystemPrompt,
  });

  // ── Stream dari Puter API ─────────────────────────────────────────────────
  // userId dikirim agar bisa ambil token yang benar (auto-mode atau static-mode)
  let puterResponse: Response;
  try {
    puterResponse = await puterChatStream({
      model,
      messages,
      userId: session.user.id, // ← KEY: pass userId untuk auto-token mode
    });
  } catch (err: any) {
    console.error("[Chat API] Puter stream error:", err);

    await prisma.message.create({
      data: {
        conversation_id: conversationId,
        role: "ASSISTANT",
        content: `Error: ${err.message ?? "Failed to connect to AI assistant"}`,
        model_id: model,
        is_error: true,
      },
    });

    // Jika error karena token invalid, kirim status khusus
    if (err.message?.includes("Token Puter") || err.message?.includes("not logged in")) {
      return NextResponse.json(
        {
          error: err.message,
          code: "PUTER_AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: err.message ?? "Failed to connect to AI assistant" },
      { status: 502 }
    );
  }

  // Pre-create assistant message placeholder
  const assistantMessageId = crypto.randomUUID();
  await prisma.message.create({
    data: {
      id: assistantMessageId,
      conversation_id: conversationId,
      role: "ASSISTANT",
      content: "",
      model_id: model,
    },
  });

  let fullContent = "";
  let totalTokens = 0;

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    async transform(chunk, controller) {
      controller.enqueue(chunk);

      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta =
            parsed.choices?.[0]?.delta?.content ??
            parsed.delta?.text ??
            "";
          if (delta) fullContent += delta;
          if (parsed.usage) totalTokens = parsed.usage.total_tokens ?? 0;
        } catch { }
      }
    },

    async flush() {
      if (fullContent) {
        await prisma.message.update({
          where: { id: assistantMessageId },
          data: { content: fullContent, tokens_used: totalTokens || null },
        });
        if (totalTokens > 0) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { total_tokens: { increment: totalTokens } },
          });
        }
      }
    },
  });

  return new Response(puterResponse.body!.pipeThrough(transformStream), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
    },
  });
}

