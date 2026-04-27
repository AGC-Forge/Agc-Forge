"use client";

import { useState } from "react";
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Sparkles,
  Send,
  Ratio,
  Timer,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DemoTab = "text" | "image" | "video";

const DEMO_TABS = [
  { id: "text" as DemoTab, label: "Chat AI", icon: MessageSquare },
  { id: "image" as DemoTab, label: "Generate Image", icon: ImageIcon },
  { id: "video" as DemoTab, label: "Generate Video", icon: Video },
];

// ── Text demo ─────────────────────────────────────────────────────────────────
function TextDemo() {
  return (
    <div className="space-y-3">
      {/* Model selector */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/3 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs text-zinc-300 font-medium">
            Claude Opus 4
          </span>
        </div>
        <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">
          Anthropic
        </span>
      </div>

      {/* Chat messages */}
      <div className="space-y-3 min-h-50">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600/20 border border-indigo-500/20 px-4 py-2.5 text-sm text-zinc-200">
            Explain how transformer architecture works in deep learning
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="h-6 w-6 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center mt-0.5">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/4 border border-white/[0.07] px-4 py-3 text-sm text-zinc-300 leading-relaxed">
            <p>
              Transformer is a revolutionary neural network architecture,
              introduced in the paper &quot;Attention Is All You Need&quot;
              (2017).
            </p>
            <p className="mt-2">Main components:</p>
            <ul className="mt-1.5 space-y-1 ml-3">
              {[
                "Self-Attention Mechanism — setiap token melihat seluruh konteks",
                "Multi-Head Attention — beberapa head belajar aspek berbeda",
                "Feed-Forward Network — transformasi per posisi",
                "Positional Encoding — informasi urutan token",
              ].map((item) => (
                <li key={item} className="flex gap-1.5 text-xs text-zinc-400">
                  <ChevronRight className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5">
        <input
          readOnly
          value="Tanya apa saja..."
          className="flex-1 bg-transparent text-sm text-zinc-600 outline-none cursor-default"
        />
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Send className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Image demo ────────────────────────────────────────────────────────────────
function ImageDemo() {
  const [aspect, setAspect] = useState("16:9");
  const [quality, setQuality] = useState("2K");

  return (
    <div className="space-y-3">
      {/* Model + config bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1 rounded-xl border border-white/[0.07] bg-white/3 px-3 py-2 text-center">
          <p className="text-[10px] text-zinc-600 mb-1">Provider</p>
          <p className="text-xs font-medium text-violet-300">Qwen Image</p>
        </div>
        <div className="col-span-1 rounded-xl border border-white/[0.07] bg-white/3 px-2 py-2">
          <p className="text-[10px] text-zinc-600 mb-1 flex items-center gap-1">
            <Ratio className="h-2.5 w-2.5" /> Rasio
          </p>
          <div className="flex gap-1 flex-wrap">
            {["1:1", "16:9", "9:16"].map((r) => (
              <button
                key={r}
                onClick={() => setAspect(r)}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded transition-all",
                  aspect === r
                    ? "bg-violet-600 text-white"
                    : "text-zinc-500 hover:text-white",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-1 rounded-xl border border-white/[0.07] bg-white/3 px-2 py-2">
          <p className="text-[10px] text-zinc-600 mb-1 flex items-center gap-1">
            <Sliders className="h-2.5 w-2.5" /> Quality
          </p>
          <div className="flex gap-1 flex-wrap">
            {["1K", "2K", "4K"].map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded transition-all",
                  quality === q
                    ? "bg-violet-600 text-white"
                    : "text-zinc-500 hover:text-white",
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-xl border border-white/[0.07] bg-white/3 px-4 py-3">
        <p className="text-xs text-zinc-500 mb-1">Prompt</p>
        <p className="text-sm text-zinc-300">
          Futuristic cityscape at dusk, neon reflections on wet streets,
          cinematic lighting, ultra-detailed
        </p>
      </div>

      {/* Result preview placeholder */}
      <div
        className={cn(
          "relative rounded-xl border border-white/[0.07] overflow-hidden bg-linear-to-br from-violet-900/20 to-indigo-900/20 flex items-center justify-center",
          aspect === "9:16" ? "h-48" : aspect === "1:1" ? "h-40" : "h-36",
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(139,92,246,0.05)_50%,transparent_75%)] animate-[shimmer_2s_linear_infinite] bg-size-[200%_200%]" />
        <div className="relative flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <span className="text-xs text-zinc-500">
            Generating {quality} · {aspect}...
          </span>
        </div>
      </div>

      {/* Generate button */}
      <button className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4" />
        Generate Image
      </button>
    </div>
  );
}

// ── Video demo ────────────────────────────────────────────────────────────────
function VideoDemo() {
  const [duration, setDuration] = useState(10);
  const [resolution, setResolution] = useState("1080p");

  return (
    <div className="space-y-3">
      {/* Config grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.07] bg-white/3 px-3 py-2">
          <p className="text-[10px] text-zinc-600 mb-1 flex items-center gap-1">
            <Timer className="h-2.5 w-2.5" /> Duration
          </p>
          <div className="flex gap-1">
            {[5, 10, 15, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded transition-all",
                  duration === d
                    ? "bg-cyan-600 text-white"
                    : "text-zinc-500 hover:text-white",
                )}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/3 px-3 py-2">
          <p className="text-[10px] text-zinc-600 mb-1">Resolution</p>
          <div className="flex gap-1">
            {["720p", "1080p", "4K"].map((r) => (
              <button
                key={r}
                onClick={() => setResolution(r)}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded transition-all",
                  resolution === r
                    ? "bg-cyan-600 text-white"
                    : "text-zinc-500 hover:text-white",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model badge */}
      <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
        <span className="text-xs text-cyan-300 font-medium">
          Kling 2.1 Master
        </span>
        <span className="ml-auto text-[10px] text-zinc-600">
          {duration}s · {resolution}
        </span>
      </div>

      {/* Prompt */}
      <div className="rounded-xl border border-white/[0.07] bg-white/3 px-4 py-3">
        <p className="text-xs text-zinc-500 mb-1">Prompt</p>
        <p className="text-sm text-zinc-300">
          A lone astronaut walks across the surface of Mars, cinematic
          slow-motion, dust particles in sunlight
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-white/[0.07] bg-white/3 px-4 py-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Generating video...</span>
          <span className="text-cyan-400 font-mono">63%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5">
          <div
            className="h-1.5 rounded-full bg-linear-to-r from-cyan-500 to-indigo-500 transition-all duration-1000"
            style={{ width: "63%" }}
          />
        </div>
        <p className="text-[10px] text-zinc-600">
          Estimated completion ~45 seconds · Extend Video available after
          completion
        </p>
      </div>

      {/* Extend video hint */}
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2">
        <Video className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <p className="text-xs text-zinc-500">
          Feature <span className="text-amber-300">Extend Video</span> — extend
          video after generate
        </p>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export function DemoSection() {
  const [activeTab, setActiveTab] = useState<DemoTab>("text");

  return (
    <section id="demo" className="relative py-24">
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-3">
            Demo Interactive
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            See it in action
          </h2>
          <p className="mt-3 text-zinc-400 max-w-lg mx-auto">
            Same interface for all output types — change mode with one click.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Tabs */}
          <div className="flex rounded-xl border border-white/[0.07] bg-white/2.5 p-1 gap-1 mb-6">
            {DEMO_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Demo card */}
          <div className="rounded-2xl border border-white/8 bg-[#0c0c14] p-5 shadow-2xl shadow-black/40">
            {activeTab === "text" && <TextDemo />}
            {activeTab === "image" && <ImageDemo />}
            {activeTab === "video" && <VideoDemo />}
          </div>
        </div>
      </div>
    </section>
  );
}
