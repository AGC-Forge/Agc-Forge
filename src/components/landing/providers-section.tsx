"use-client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  {
    name: "Anthropic",
    color: "#D97706",
    models: 12,
    specialty: "Text & Reasoning",
    logo: "/images/providers/anthropic.png",
  },
  {
    name: "OpenAI",
    color: "#10B981",
    models: 28,
    specialty: "Text & Code",
    logo: "/images/providers/openai.png",
  },
  {
    name: "Google",
    color: "#3B82F6",
    models: 8,
    specialty: "Multimodal",
    logo: "/images/providers/gemini.png",
  },
  {
    name: "xAI / Grok",
    color: "#8B5CF6",
    models: 4,
    specialty: "Real-time Info",
    logo: "/images/providers/xai.png",
  },
  {
    name: "Deepseek",
    color: "#06B6D4",
    models: 7,
    specialty: "Reasoning",
    logo: "/images/providers/deepseek.png",
  },
  {
    name: "Bytedance",
    color: "#F59E0B",
    models: 2,
    specialty: "Video",
    logo: "/images/providers/bytedance.png",
  },
  {
    name: "Kling",
    color: "#EC4899",
    models: 6,
    specialty: "Video",
    logo: "/images/providers/kling.jpg",
  },
  {
    name: "Qwen",
    color: "#6366F1",
    models: 14,
    specialty: "Text & Image",
    logo: "/images/providers/qwen.png",
  },
  {
    name: "Wan AI",
    color: "#14B8A6",
    models: 4,
    specialty: "Video",
    logo: "/images/providers/wan-ai.png",
  },
  {
    name: "Pixverse",
    color: "#F97316",
    models: 1,
    specialty: "Multimodal",
    logo: "/images/providers/pixverse.svg",
  },
];

function ProviderBadge({
  provider,
  className,
}: {
  provider: (typeof PROVIDERS)[0];
  className?: string;
}) {
  const [typeLogoHover, setTypeLogoHover] = useState<"logo" | "name">("logo");
  return (
    <div
      className={cn(
        "group relative flex shrink-0 items-center gap-3 rounded-xl border border-white/[0.07]",
        "bg-white/3 px-4 py-3 transition-all hover:border-white/15 hover:bg-white/6",
        className,
      )}
    >
      {/* Color dot */}
      {typeLogoHover === "name" ? (
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{
            backgroundColor: provider.color + "25",
            border: `1px solid ${provider.color}40`,
          }}
        >
          <span style={{ color: provider.color }}>
            {provider.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      ) : (
        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold bg-white shrink-0">
          <Image
            src={provider.logo}
            alt={provider.name}
            width={24}
            height={24}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-white whitespace-nowrap">
          {provider.name}
        </p>
        <p className="text-xs text-zinc-500 whitespace-nowrap">
          {provider.models} model · {provider.specialty}
        </p>
      </div>
    </div>
  );
}

export function ProvidersSection() {
  return (
    <section id="providers" className="relative py-20 overflow-hidden">
      {/* Section divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-3">
            Provider AI
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            10 Provider, 80+ Model
          </h2>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto">
            From powerful text models to video and image generators — all
            available without switching apps.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-lg mx-auto">
          {[
            { value: "10+", label: "Provider" },
            { value: "80+", label: "Model AI" },
            { value: "3", label: "Jenis Output" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center rounded-xl border border-white/[0.07] bg-white/3 py-4"
            >
              <p className="text-2xl font-bold bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Marquee row 1 — left to right */}
        <div className="relative overflow-hidden -mx-6 lg:-mx-8">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-[#050508] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-[#050508] to-transparent z-10" />

          <div className="flex animate-[marquee_30s_linear_infinite] gap-3 w-max px-6">
            {[...PROVIDERS, ...PROVIDERS].map((provider, i) => (
              <ProviderBadge
                key={`${provider.name}-${i}`}
                provider={provider}
              />
            ))}
          </div>
        </div>

        {/* Marquee row 2 — right to left */}
        <div className="relative overflow-hidden -mx-6 lg:-mx-8 mt-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-[#050508] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-[#050508] to-transparent z-10" />

          <div className="flex animate-marquee-reverse gap-3 w-max px-6">
            {[
              ...PROVIDERS.slice().reverse(),
              ...PROVIDERS.slice().reverse(),
            ].map((provider, i) => (
              <ProviderBadge
                key={`${provider.name}-r-${i}`}
                provider={provider}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
