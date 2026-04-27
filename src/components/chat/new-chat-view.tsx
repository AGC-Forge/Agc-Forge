"use client";

import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Sparkles,
} from "lucide-react";
import { MessageInput } from "@/components/chat/message-input";
import { useModelStore } from "@/store/model-store";
import { toast } from "sonner";

const SUGGESTION_CHIPS = [
  {
    text: "Describe the working of a neural network",
    skill: "text" as AISkill,
  },
  { text: "Write the quicksort function in Python", skill: "text" as AISkill },
  {
    text: "Generate images of cyberpunk cities at night",
    skill: "image" as AISkill,
  },
  { text: "Generate video ocean waves cinematic", skill: "video" as AISkill },
];

interface NewChatViewProps {
  user: { id: string; name?: string | null };
}

export function NewChatView({ user }: NewChatViewProps) {
  const router = useRouter();
  const { selectedModel, selectedProvider, activeSkill, autoSelectModel } =
    useModelStore();

  const handleSend = async (payload: {
    content: string;
    files?: File[];
    imageConfig?: ImageGenConfig;
    videoConfig?: VideoGenConfig;
  }) => {
    if (!selectedModel) {
      toast.error("Select the model first in the header.");
      return;
    }

    try {
      // Buat conversation baru
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.content.slice(0, 60) || "New Conversation",
          provider: selectedProvider,
          model_id: selectedModel.id,
          skill: activeSkill.toUpperCase(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create conversation");

      const { data: conversation } = (await res.json()) as ApiResponse<{
        id: string;
      }>;
      if (!conversation) throw new Error("No conversation data");

      // Redirect ke conversation baru (pesan akan dikirim di sana)
      router.push(
        `/chat/${conversation.id}?init=${encodeURIComponent(payload.content)}`,
      );
    } catch (err: any) {
      toast.error(err.message ?? "Failed to start chat.");
    }
  };

  const firstName = user.name?.split(" ")[0] ?? "You";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Greeting */}
          <div className="text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 mx-auto">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white">
              {greeting}, {firstName}!
            </h1>
            <p className="text-sm text-zinc-500">
              What can I help you with today?
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTION_CHIPS.map((chip) => {
              const Icon =
                chip.skill === "image"
                  ? ImageIcon
                  : chip.skill === "video"
                    ? Video
                    : MessageSquare;
              const isActive = chip.skill === activeSkill;

              return (
                <button
                  key={chip.text}
                  onClick={() => {
                    if (chip.skill !== activeSkill) autoSelectModel(chip.skill);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/6 hover:border-white/[0.14] transition-all"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {chip.text}
                </button>
              );
            })}
          </div>

          {/* Active model indicator */}
          {selectedModel && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/6 bg-white/2 px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span className="text-xs text-zinc-500">
                  Using{" "}
                  <span className="text-zinc-300 font-medium">
                    {selectedModel.label}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input at bottom */}
      <MessageInput conversationId={null} onSend={handleSend} />
    </div>
  );
}
