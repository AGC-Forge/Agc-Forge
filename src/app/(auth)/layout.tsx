import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export const metadata: Metadata = {
  title: {
    template: "%s | Forge AI",
    default: "Auth",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#09090b] py-10">
      {/* ── Animated gradient mesh background ─────────────── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-40 -left-40 h-125 w-125 rounded-full bg-indigo-600/10 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -right-20 h-100 w-100 rounded-full bg-violet-600/8 blur-[100px] animate-[pulse_10s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-cyan-600/5 blur-[140px] animate-[pulse_12s_ease-in-out_infinite_4s]" />
      </div>

      {/* ── Subtle grid overlay ────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Logo ──────────────────────────────────────────── */}
      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-2.5 group"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 transition-all group-hover:shadow-indigo-600/50 group-hover:scale-105">
          <BrainCircuit className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-white">
          Forge AI
        </span>
      </Link>

      {/* ── Card content ──────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl border border-white/6 bg-white/3 p-8 shadow-2xl shadow-black/50 backdrop-blur-sm">
          {children}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <p className="relative z-10 mt-8 text-xs text-zinc-600">
        © {new Date().getFullYear()} Forge AI. All rights reserved.
      </p>
    </div>
  );
}
