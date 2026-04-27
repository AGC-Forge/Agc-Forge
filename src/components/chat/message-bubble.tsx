"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Zap,
  AlertCircle,
  Image as ImageIcon,
  Video,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Media preview ─────────────────────────────────────────────────────────────

function MediaPreview({ media }: { media: MediaItem }) {
  if (media.type === "IMAGE") {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-white/8 max-w-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={media.original_filename}
          className="w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <a href={media.url} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Download className="h-3 w-3 mr-1" /> Download
            </Button>
          </a>
        </div>
        {media.gen_aspect_ratio && (
          <div className="absolute top-2 left-2 rounded-md bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] text-zinc-300">
            {media.gen_aspect_ratio} · {media.gen_quality}
          </div>
        )}
      </div>
    );
  }

  if (media.type === "VIDEO") {
    return (
      <div className="rounded-xl overflow-hidden border border-white/8 max-w-sm">
        <video
          src={media.url}
          controls
          className="w-full rounded-xl"
          preload="metadata"
        />
        {media.gen_resolution && (
          <div className="px-3 py-1.5 bg-white/3 text-[10px] text-zinc-500">
            {media.gen_resolution} · {media.gen_duration}s
          </div>
        )}
      </div>
    );
  }

  // Dokumen / code / lainnya
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 max-w-xs">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
        {media.type === "CODE" ? (
          <FileText className="h-4 w-4 text-indigo-400" />
        ) : (
          <FileText className="h-4 w-4 text-zinc-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-200 truncate">
          {media.original_filename}
        </p>
        <p className="text-[10px] text-zinc-600">
          {media.mime_type} ·{" "}
          {media.size ? `${Math.round(media.size / 1024)} KB` : ""}
        </p>
      </div>
      <a href={media.url} target="_blank" rel="noopener noreferrer">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-zinc-500 hover:text-zinc-200"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </a>
    </div>
  );
}

// ── Gen Job Progress ──────────────────────────────────────────────────────────

function GenJobProgress({ job }: { job: GenJob }) {
  if (job.status === "COMPLETED" && job.result_url) {
    return null; // Ditampilkan via Media
  }

  const isVideo = job.job_type === "VIDEO";
  const Icon = isVideo ? Video : ImageIcon;
  const accent = isVideo ? "text-cyan-400" : "text-violet-400";
  const bgAccent = isVideo ? "bg-cyan-500" : "bg-violet-500";

  return (
    <div
      className={cn(
        "rounded-xl border border-white/8 bg-white/3 p-4 max-w-sm space-y-3",
        job.status === "FAILED" && "border-red-500/20 bg-red-500/5",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg bg-white/5",
          )}
        >
          <Icon className={cn("h-4 w-4", accent)} />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-200">
            {isVideo ? "Generating Video" : "Generating Image"}
          </p>
          <p className="text-[10px] text-zinc-500 font-mono">{job.model_id}</p>
        </div>
        {job.status === "FAILED" && (
          <AlertCircle className="h-4 w-4 text-red-400 ml-auto" />
        )}
      </div>

      {job.status === "FAILED" ? (
        <p className="text-xs text-red-400">
          {job.error_message || "Generation failed."}
        </p>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500 capitalize">
                {job.status.toLowerCase()}...
              </span>
              <span className={cn("font-mono", accent)}>{job.progress}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/5">
              <div
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  bgAccent,
                )}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
          <div className="flex gap-3 text-[10px] text-zinc-600">
            {job.aspect_ratio && <span>Ratio: {job.aspect_ratio}</span>}
            {job.quality && <span>Quality: {job.quality}</span>}
            {job.resolution && <span>{job.resolution}</span>}
            {job.duration && <span>{job.duration}s</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  userName?: string;
  userInitials?: string;
}

export function MessageBubble({
  message,
  userName,
  userInitials,
}: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const isAssistant = message.role === "ASSISTANT";

  // Simple markdown-like rendering: detect code blocks
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const lines = part.split("\n");
        const lang = lines[0].replace("```", "").trim();
        const code = lines.slice(1, -1).join("\n");
        return (
          <div
            key={i}
            className="rounded-lg border border-white/8 bg-black/30 overflow-hidden my-2"
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/6 bg-white/2">
              <span className="text-[11px] text-zinc-500 font-mono">
                {lang || "code"}
              </span>
              <CopyButton text={code} />
            </div>
            <pre className="p-3 text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return (
        <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
          {part}
        </p>
      );
    });
  };

  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      {isUser ? (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback className="bg-indigo-600 text-white text-xs font-medium">
            {userInitials ?? "U"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-white/8 mt-0.5">
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "flex flex-col gap-2 min-w-0",
          isUser ? "items-end" : "items-start",
          "max-w-[80%]",
        )}
      >
        {/* Model badge (assistant only) */}
        {isAssistant && message.model_id && (
          <span className="text-[10px] font-mono text-zinc-600">
            {message.model_id}
          </span>
        )}

        {/* Text bubble */}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5",
              isUser
                ? "bg-indigo-600/20 border border-indigo-500/20 text-zinc-100 rounded-tr-sm"
                : "bg-white/4 border border-white/[0.07] text-zinc-200 rounded-tl-sm",
              message.is_error && "border-red-500/30 bg-red-500/5 text-red-300",
            )}
          >
            {message.is_error && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Error
              </div>
            )}
            <div className={cn(isUser ? "text-zinc-100" : "text-zinc-200")}>
              {renderContent(message.content)}
            </div>
          </div>
        )}

        {/* Media attachments */}
        {message.media && message.media.length > 0 && (
          <div className="flex flex-col gap-2">
            {message.media.map((m) => (
              <MediaPreview key={m.id} media={m} />
            ))}
          </div>
        )}

        {/* Gen jobs */}
        {message.gen_jobs && message.gen_jobs.length > 0 && (
          <div className="flex flex-col gap-2">
            {message.gen_jobs.map((job) => (
              <GenJobProgress key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Timestamp + copy */}
        <div
          className={cn(
            "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser && "flex-row-reverse",
          )}
        >
          <span className="text-[10px] text-zinc-600">
            {new Date(message.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isAssistant && message.content && (
            <CopyButton text={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Streaming Bubble ──────────────────────────────────────────────────────────

export function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-white/8 mt-0.5">
        <Zap className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white/4 border border-white/[0.07] px-4 py-2.5 max-w-[80%]">
        {content ? (
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {content}
            <span className="ml-0.5 inline-block h-4 w-0.5 bg-indigo-400 align-middle animate-[blink_1s_step-end_infinite]" />
          </p>
        ) : (
          <div className="flex items-center gap-1 py-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
