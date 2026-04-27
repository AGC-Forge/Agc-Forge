"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useChatStore } from "@/store/chat-store";
import { useModelStore } from "@/store/model-store";

interface SendPayload {
  content: string;
  files?: File[];
  imageConfig?: ImageGenConfig;
  videoConfig?: VideoGenConfig;
  conversationId: string;
  history?: Array<{ role: string; content: string }>;
  systemPrompt?: string;
}

interface UseChatReturn {
  isLoading: boolean;
  activeJobId: string | null;
  sendMessage: (payload: SendPayload) => Promise<void>;
  uploadFiles: (files: File[], messageId?: string) => Promise<UploadedFile[]>;
}

export function useChat(): UseChatReturn {
  const router = useRouter();
  const { startStream, appendStream, endStream, setGenerating } = useChatStore();
  const { selectedModel, selectedProvider, activeSkill } = useModelStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // ── Upload files to MinIO ────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files: File[], messageId?: string): Promise<UploadedFile[]> => {
      if (files.length === 0) return [];

      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      if (messageId) formData.append("messageId", messageId);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload file gagal");

      const { data } = await res.json();
      if (data.errorCount > 0) {
        data.errors.forEach((e: { filename: string; error: string }) =>
          toast.warning(`${e.filename}: ${e.error}`)
        );
      }
      return data.uploaded ?? [];
    },
    []
  );

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (payload: SendPayload): Promise<void> => {
      if (!selectedModel) {
        toast.error("Pilih model terlebih dahulu.");
        return;
      }

      const {
        content,
        files = [],
        imageConfig,
        videoConfig,
        conversationId,
        history = [],
        systemPrompt,
      } = payload;

      setIsLoading(true);

      try {
        // ── Upload files dulu jika ada ────────────────────────────────────
        let uploadedFiles: UploadedFile[] = [];
        if (files.length > 0) {
          uploadedFiles = await uploadFiles(files);
        }

        const mediaUrls = uploadedFiles.map((f) => ({
          url: f.url,
          filename: f.original_filename,
          mimeType: f.mime_type,
        }));

        // ── Text chat via streaming ───────────────────────────────────────
        if (activeSkill === "text") {
          startStream(conversationId);

          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              content,
              model: selectedModel.id,
              provider: selectedProvider,
              history,
              mediaUrls,
              systemPrompt,
            }),
          });

          if (!res.ok || !res.body) {
            endStream();
            throw new Error("Stream gagal");
          }

          // Read SSE stream
          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            const lines = text.split("\n").filter((l) => l.startsWith("data: "));
            for (const line of lines) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const chunk =
                  parsed.choices?.[0]?.delta?.content ?? parsed.delta?.text ?? "";
                if (chunk) appendStream(chunk);
              } catch { }
            }
          }

          endStream();
          router.refresh();
        }

        // ── Image generation (async) ──────────────────────────────────────
        else if (activeSkill === "image" && imageConfig) {
          const res = await fetch("/api/ai/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, ...imageConfig }),
          });

          if (!res.ok) throw new Error("Gagal memulai generate gambar");
          const { data } = await res.json();
          setActiveJobId(data.jobId);
          setGenerating(data.jobId);
          toast.info("Generate gambar dimulai. Pantau progressnya...");
        }

        // ── Video generation (async) ──────────────────────────────────────
        else if (activeSkill === "video" && videoConfig) {
          const res = await fetch("/api/ai/video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, ...videoConfig }),
          });

          if (!res.ok) throw new Error("Gagal memulai generate video");
          const { data } = await res.json();
          setActiveJobId(data.jobId);
          setGenerating(data.jobId);
          toast.info(`Generate video dimulai. Estimasi: ${data.estimatedDuration}`);
        }
      } catch (err: any) {
        endStream();
        setGenerating(null);
        toast.error(err.message ?? "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedModel,
      selectedProvider,
      activeSkill,
      startStream,
      appendStream,
      endStream,
      setGenerating,
      uploadFiles,
      router,
    ]
  );

  return { isLoading, activeJobId, sendMessage, uploadFiles };
}
