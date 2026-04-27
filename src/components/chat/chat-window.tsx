"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import {
  MessageBubble,
  StreamingBubble,
} from "@/components/chat/message-bubble";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  messages: ChatMessage[];
  conversationId: string;
  userInitials?: string;
}

export function ChatWindow({
  messages,
  conversationId,
  userInitials,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isStreaming, streamingContent, streamingConversationId } =
    useChatStore();

  const showStreaming =
    isStreaming && streamingConversationId === conversationId;

  // Auto-scroll ke bawah saat pesan baru / streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  if (messages.length === 0 && !showStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/3">
          <MessageSquare className="h-7 w-7 text-zinc-600" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-zinc-300">
            Start new conversation
          </p>
          <p className="text-sm text-zinc-600">
            Type messages, upload file, or generate images & video
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            userInitials={userInitials}
          />
        ))}

        {/* Streaming bubble */}
        {showStreaming && <StreamingBubble content={streamingContent} />}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
