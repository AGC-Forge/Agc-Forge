import { auth } from "@/auth";
import { type NextRequest } from "next/server";
import { getJobProgress, redisSub } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ai/status/[jobId]
 * Server-Sent Events stream untuk real-time progress job generate
 * Client poll atau subscribe SSE untuk dapat update progress
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId } = await params;

  // Verifikasi job milik user
  const job = await prisma.genJob.findFirst({
    where: {
      id: jobId,
      conversation: { userId: session.user.id },
    },
    select: { id: true, status: true, progress: true, result_url: true, error_message: true },
  });

  if (!job) {
    return new Response("Job not found or not accessible", { status: 404 });
  }

  // Jika sudah terminal state, return langsung (tidak perlu SSE)
  if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
    const data = JSON.stringify({
      jobId,
      status: job.status,
      progress: job.progress,
      result_url: job.result_url,
      error_message: job.error_message,
      updated_at: new Date().toISOString(),
    });

    return new Response(`data: ${data}\n\ndata: [DONE]\n\n`, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ── SSE Stream via Redis pub/sub ──────────────────────────────────────────
  const encoder = new TextEncoder();
  let unsubscribed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        if (unsubscribed) return;
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch { }
      };

      // Kirim status awal dari Redis
      const current = await getJobProgress(jobId);
      if (current) {
        sendEvent(current);
      }

      // Subscribe ke Redis channel
      const channel = "job:progress";

      const messageHandler = (receivedChannel: string, message: string) => {
        if (receivedChannel !== channel) return;
        try {
          const data = JSON.parse(message);
          if (data.jobId !== jobId) return; // Filter hanya job ini

          sendEvent(data);

          // Jika terminal state, close stream
          if (
            data.status === "COMPLETED" ||
            data.status === "FAILED" ||
            data.status === "CANCELLED"
          ) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            unsubscribed = true;
            redisSub.unsubscribe(channel);
          }
        } catch { }
      };

      redisSub.on("message", messageHandler);
      await redisSub.subscribe(channel);

      // Timeout: max 10 menit, lalu close
      const timeout = setTimeout(() => {
        if (!unsubscribed) {
          sendEvent({ jobId, status: "timeout", progress: 0 });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          unsubscribed = true;
          redisSub.off("message", messageHandler);
        }
      }, 10 * 60 * 1000);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        unsubscribed = true;
        clearTimeout(timeout);
        redisSub.off("message", messageHandler);
      });
    },

    cancel() {
      unsubscribed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
    },
  });
}
