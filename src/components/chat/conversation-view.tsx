"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChatWindow } from "@/components/chat/chat-window";
import { MessageInput } from "@/components/chat/message-input";
import { useChatStore } from "@/store/chat-store";
import { useModelStore } from "@/store/model-store";

interface ConversationViewProps {
  conversation: Conversation & { messages: ChatMessage[] };
  userInitials: string;
  initialMessage?: string;
}

export function ConversationView({
  conversation,
  userInitials,
  initialMessage,
}: ConversationViewProps) {
  const router = useRouter();
  const { startStream, appendStream, endStream } = useChatStore();
  const { selectedModel, selectedProvider, activeSkill } = useModelStore();

  // Local optimistic messages state
  const [messages, setMessages] = useState<ChatMessage[]>(
    conversation.messages as ChatMessage[],
  );
  const didAutoSendInitMessage = useRef(false);

  const handleSend = useCallback(
    async (payload: {
      content: string;
      files?: File[];
      imageConfig?: ImageGenConfig;
      videoConfig?: VideoGenConfig;
    }) => {
      if (!selectedModel) {
        toast.error("Select a model first in the header.");
        return;
      }

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversation.id,
        role: "USER",
        content: payload.content,
        is_error: false,
        created_at: new Date(),
        media: [],
        gen_jobs: [],
        model_id: null,
        tokens_used: null,
      };

      // Optimistic update
      setMessages((prev) => [...prev, userMessage]);

      try {
        if (activeSkill === "text") {
          // ── Streaming text chat ──────────────────────────────────────────
          startStream(conversation.id);

          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: conversation.id,
              content: payload.content,
              model: selectedModel.id,
              provider: selectedProvider,
              history: messages.slice(-20).map((m) => ({
                role: m.role.toLowerCase(),
                content: m.content,
              })),
            }),
          });

          if (!res.ok || !res.body) {
            throw new Error("Stream failed");
          }

          // Read SSE stream
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(Boolean);

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const text =
                    parsed.choices?.[0]?.delta?.content ??
                    parsed.delta?.text ??
                    "";
                  if (text) {
                    fullContent += text;
                    appendStream(text);
                  }
                } catch {}
              }
            }
          }

          endStream();

          // Refresh untuk dapat pesan yang tersimpan di DB
          router.refresh();
        } else {
          // ── Image / Video generation ─────────────────────────────────────
          const endpoint =
            activeSkill === "image" ? "/api/ai/image" : "/api/ai/video";

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: conversation.id,
              messageId: userMessage.id,
              ...(activeSkill === "image"
                ? payload.imageConfig
                : payload.videoConfig),
            }),
          });

          if (!res.ok) throw new Error("Generate failed");
          const { data } = await res.json();
          toast.success(
            activeSkill === "image"
              ? "Generate image started!"
              : "Generate video started.",
          );
          router.refresh();
        }
      } catch (err: any) {
        endStream();
        toast.error(err.message ?? "Error generating.");

        // Mark user message as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, is_error: true } : m,
          ),
        );
      }
    },
    [
      selectedModel,
      selectedProvider,
      activeSkill,
      conversation.id,
      messages,
      startStream,
      appendStream,
      endStream,
      router,
    ],
  );

  // Kirim init message jika ada (dari new chat redirect)
  useEffect(() => {
    if (didAutoSendInitMessage.current) return;
    if (initialMessage && messages.length === 0) {
      didAutoSendInitMessage.current = true;
      // Hapus ?init dari URL tanpa reload
      window.history.replaceState({}, "", `/chat/${conversation.id}`);
      const timeoutId = window.setTimeout(() => {
        void handleSend({ content: initialMessage });
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ChatWindow
        messages={messages}
        conversationId={conversation.id}
        userInitials={userInitials}
      />
      <MessageInput conversationId={conversation.id} onSend={handleSend} />
    </div>
  );
}
