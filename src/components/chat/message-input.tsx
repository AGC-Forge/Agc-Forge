"use client";

import { useState, useRef } from "react";
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  Video,
  Sliders,
  Ratio,
  Timer,
  Loader2,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/model-store";
import { useChatStore } from "@/store/chat-store";
import { toast } from "sonner";

// ── Option lists ──────────────────────────────────────────────────────────────

const ASPECT_RATIO_OPTIONS: {
  value: AspectRatio;
  label: string;
  icon: string;
}[] = [
  { value: "1:1", label: "Square", icon: "□" },
  { value: "16:9", label: "Landscape", icon: "▭" },
  { value: "9:16", label: "Portrait", icon: "▯" },
  { value: "4:3", label: "Standard", icon: "▭" },
  { value: "3:4", label: "Portrait", icon: "▯" },
  { value: "21:9", label: "Cinematic", icon: "━" },
];

const IMAGE_QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: "512", label: "512px" },
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
];

const VIDEO_DURATION_OPTIONS: { value: VideoDuration; label: string }[] = [
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
];

const VIDEO_RESOLUTION_OPTIONS: { value: VideoResolution; label: string }[] = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4K", label: "4K" },
];

// ── Option row helper ─────────────────────────────────────────────────────────

function OptionPill<T extends string | number>({
  options,
  value,
  onChange,
  accent = "indigo",
}: {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
  accent?: "indigo" | "violet" | "cyan";
}) {
  const activeClass =
    accent === "violet"
      ? "bg-violet-600 text-white"
      : accent === "cyan"
        ? "bg-cyan-600 text-white"
        : "bg-indigo-600 text-white";

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-all",
            value === opt.value
              ? activeClass
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5",
          )}
        >
          {opt.icon && <span className="text-[10px]">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Attached File Preview ─────────────────────────────────────────────────────

function AttachedFileChip({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");
  const url = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 pr-7 group">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name}
          className="h-5 w-5 rounded object-cover"
        />
      ) : (
        <div className="h-5 w-5 rounded bg-zinc-700 flex items-center justify-center">
          <span className="text-[9px] text-zinc-400 uppercase">
            {file.name.split(".").pop()}
          </span>
        </div>
      )}
      <span className="text-xs text-zinc-300 max-w-20 truncate">
        {file.name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-200 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Main MessageInput ─────────────────────────────────────────────────────────

interface MessageInputProps {
  conversationId: string | null;
  onSend: (payload: {
    content: string;
    files?: File[];
    imageConfig?: ImageGenConfig;
    videoConfig?: VideoGenConfig;
  }) => Promise<void>;
}

export function MessageInput({ conversationId, onSend }: MessageInputProps) {
  const { activeSkill, selectedModel, selectedProvider } = useModelStore();
  const { isStreaming, isGenerating } = useChatStore();

  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image config state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [imageQuality, setImageQuality] = useState<ImageQuality>("2K");

  // Video config state
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(10);
  const [videoResolution, setVideoResolution] =
    useState<VideoResolution>("1080p");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = isStreaming || isGenerating || isSubmitting;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5)); // max 5 files
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  async function handleSend() {
    const content = value.trim();
    if (!content && files.length === 0) return;
    if (!selectedModel) {
      toast.error("Select the model first.");
      return;
    }
    if (isBusy) return;

    setIsSubmitting(true);
    try {
      const payload: Parameters<typeof onSend>[0] = { content, files };

      if (activeSkill === "image") {
        payload.imageConfig = {
          prompt: content,
          model_id: selectedModel.id,
          provider: selectedProvider,
          aspect_ratio: aspectRatio,
          quality: imageQuality,
        };
      } else if (activeSkill === "video") {
        payload.videoConfig = {
          prompt: content,
          model_id: selectedModel.id,
          provider: selectedProvider,
          aspect_ratio: aspectRatio,
          resolution: videoResolution,
          duration: videoDuration,
        };
      }

      await onSend(payload);
      setValue("");
      setFiles([]);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isImage = activeSkill === "image";
  const isVideo = activeSkill === "video";
  const hasConfig = isImage || isVideo;

  return (
    <div className="border-t border-white/6 bg-[#09090b] px-4 py-3">
      <div className="mx-auto max-w-3xl space-y-2">
        {/* ── Config panel (image / video) ─────────────────────────────────── */}
        {hasConfig && showConfig && (
          <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-3">
            {isImage && (
              <>
                <div className="flex items-center gap-2">
                  <Ratio className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-zinc-400">
                    Aspect Ratio
                  </span>
                </div>
                <OptionPill
                  options={ASPECT_RATIO_OPTIONS}
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  accent="violet"
                />
                <div className="flex items-center gap-2 pt-1">
                  <Sliders className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-zinc-400">
                    Quality
                  </span>
                </div>
                <OptionPill
                  options={IMAGE_QUALITY_OPTIONS}
                  value={imageQuality}
                  onChange={setImageQuality}
                  accent="violet"
                />
              </>
            )}

            {isVideo && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Timer className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-medium text-zinc-400">
                        Duration
                      </span>
                    </div>
                    <OptionPill
                      options={VIDEO_DURATION_OPTIONS}
                      value={videoDuration}
                      onChange={setVideoDuration}
                      accent="cyan"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-medium text-zinc-400">
                        Resolution
                      </span>
                    </div>
                    <OptionPill
                      options={VIDEO_RESOLUTION_OPTIONS}
                      value={videoResolution}
                      onChange={setVideoResolution}
                      accent="cyan"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Ratio className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-zinc-400">
                    Aspect Ratio
                  </span>
                </div>
                <OptionPill
                  options={ASPECT_RATIO_OPTIONS}
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  accent="cyan"
                />
              </>
            )}
          </div>
        )}

        {/* ── Attached files ───────────────────────────────────────────────── */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <AttachedFileChip
                key={idx}
                file={file}
                onRemove={() => removeFile(idx)}
              />
            ))}
          </div>
        )}

        {/* ── Input box ────────────────────────────────────────────────────── */}
        <div className="relative flex items-end rounded-2xl border border-white/8 bg-white/3 px-3 py-2.5 gap-2 focus-within:border-indigo-500/40 transition-colors">
          {/* Left actions */}
          <div className="flex items-center gap-1 pb-0.5 shrink-0">
            {/* File upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all disabled:opacity-40"
              title="Upload file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.js,.ts,.jsx,.tsx,.py,.html,.css,.json,.yaml"
              className="sr-only"
              onChange={handleFileChange}
            />

            {/* Config toggle (image/video) */}
            {hasConfig && (
              <button
                type="button"
                onClick={() => setShowConfig((v) => !v)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  showConfig
                    ? isImage
                      ? "bg-violet-600/20 text-violet-400"
                      : "bg-cyan-600/20 text-cyan-400"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5",
                )}
                title="Config generate"
              >
                {isImage ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isImage
                ? "Describe the image you want to generate..."
                : isVideo
                  ? "Describe the video you want to generate..."
                  : "Type message... (Enter send, Shift+Enter new line)"
            }
            disabled={isBusy}
            rows={1}
            className={cn(
              "flex-1 min-h-9 max-h-50 resize-none border-0 bg-transparent",
              "p-0 text-sm text-zinc-200 placeholder:text-zinc-600",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700",
            )}
          />

          {/* Send / Stop button */}
          <div className="pb-0.5 shrink-0">
            {isBusy ? (
              <Button
                type="button"
                size="icon"
                onClick={() => {
                  /* TODO: cancel stream */
                }}
                className="h-8 w-8 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white"
                title="Stop"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                disabled={!value.trim() && files.length === 0}
                className={cn(
                  "h-8 w-8 rounded-xl text-white transition-all",
                  isImage
                    ? "bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/25"
                    : isVideo
                      ? "bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/25"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
                title="Send (Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-zinc-700">
          {selectedModel
            ? `${selectedModel.label} · ${selectedProvider}`
            : "Select model in header"}
          {" · "}
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
