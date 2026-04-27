"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Typing animation ──────────────────────────────────────────────────────────
const TYPING_WORDS = [
  "Claude Opus",
  "GPT-5",
  "Gemini 2.0",
  "Grok 4",
  "Deepseek V4",
];

function TypingWord() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = TYPING_WORDS[index];
    let timeout: NodeJS.Timeout;

    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(
        () => setDisplayed(word.slice(0, displayed.length + 1)),
        80,
      );
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
    } else {
      timeout = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % TYPING_WORDS.length);
      }, 45);
      // (line removed to avoid duplicate setIndex call)
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, index]);

  return (
    <span className="relative">
      <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
        {displayed}
      </span>
      <span className="ml-0.5 inline-block w-0.5 h-[0.9em] bg-indigo-400 align-middle animate-[blink_1s_step-end_infinite]" />
    </span>
  );
}

// ── Floating chat bubble preview ──────────────────────────────────────────────
const PREVIEW_MESSAGES = [
  { role: "user", text: "Create futuristic landscape images with AI" },
  {
    role: "assistant",
    text: "Tentu! Using Flux Pro to generate the best visual...",
    model: "Flux Pro",
  },
  { role: "user", text: "Create video 10 seconds from the image above" },
  {
    role: "assistant",
    text: "Processing with Kling 2.1 Master... 87%",
    model: "Kling 2.1",
    progress: 87,
  },
];

function ChatPreview() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= PREVIEW_MESSAGES.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 900 + visible * 300);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Window chrome */}
      <div className="rounded-2xl border border-white/8 bg-[#0d0d14] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Titlebar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/6 bg-white/2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-xs text-zinc-600 font-mono">
            Forge AI — New Conversation
          </span>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 min-h-55">
          {PREVIEW_MESSAGES.slice(0, visible).map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5 transition-all duration-500",
                "animate-in fade-in slide-in-from-bottom-2",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 mt-0.5">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-indigo-600/20 border border-indigo-500/20 text-zinc-200 rounded-br-sm"
                    : "bg-white/5 border border-white/6 text-zinc-300 rounded-bl-sm",
                )}
              >
                {msg.model && (
                  <div className="text-[10px] text-indigo-400 font-mono mb-1 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" />
                    {msg.model}
                  </div>
                )}
                {msg.text}
                {msg.progress !== undefined && (
                  <div className="mt-2">
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <div
                        className="h-1 rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
                        style={{ width: `${msg.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      {msg.progress}% done
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {visible === PREVIEW_MESSAGES.length && (
            <div className="flex gap-2.5 animate-in fade-in">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div className="bg-white/5 border border-white/6 rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5">
            <span className="text-xs text-zinc-600 flex-1">
              Tanya apa saja...
            </span>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded flex items-center justify-center bg-white/5">
                <ImageIcon className="h-3 w-3 text-zinc-500" />
              </div>
              <div className="h-5 w-5 rounded flex items-center justify-center bg-white/5">
                <Video className="h-3 w-3 text-zinc-500" />
              </div>
              <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-indigo-600">
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative glow under card */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-3/4 bg-indigo-600/20 blur-2xl rounded-full" />
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-28 pb-20 lg:px-8">
      <div className="mx-auto max-w-7xl w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="flex flex-col items-start gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/8 px-4 py-1.5 text-sm text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              All best AI models in one place
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] tracking-tight">
              <span className="text-white">Chat with</span>
              <br />
              <TypingWord />
              <br />
              <span className="text-zinc-400 text-4xl lg:text-5xl xl:text-6xl font-normal">
                now
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
              One platform for all your AI needs — from intelligent
              conversations to high-quality image generation to cinematic video
              creation. Choose the best model for each task.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/40 transition-all group"
                >
                  Start free now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View demo
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D", "E"].map((l, i) => (
                  <div
                    key={l}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#050508] text-xs font-medium text-white"
                    style={{
                      background: `hsl(${210 + i * 40}, 70%, 45%)`,
                      zIndex: 5 - i,
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-500">
                <span className="text-white font-medium">10,000+</span> active
                users
              </p>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm lg:max-w-md xl:max-w-lg animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
              <ChatPreview />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-zinc-500 tracking-widest uppercase">
            Scroll
          </span>
          <div className="h-8 w-px bg-linear-to-b from-zinc-500 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}
