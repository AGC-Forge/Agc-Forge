import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { ProvidersSection } from "@/components/landing/providers-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { DemoSection } from "@/components/landing/demo-section";
import { CapabilitiesSection } from "@/components/landing/capabilities-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Forge AI — All AI Models in One Platform",
  description:
    "Chat, generate images, and create videos with the best AI models — Claude, GPT, Gemini, Grok, Deepseek, Kling, and more. It's free to try.",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* Global background effects */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        {/* Top-left violet glow */}
        <div className="absolute -top-60 -left-60 h-175 w-175 rounded-full bg-violet-700/8 blur-[160px]" />
        {/* Center-right indigo */}
        <div className="absolute top-1/3 -right-40 h-125 w-125 rounded-full bg-indigo-600/6 blur-[140px]" />
        {/* Bottom-left cyan */}
        <div className="absolute bottom-0 left-1/4 h-100 w-100 rounded-full bg-cyan-600/5 blur-[120px]" />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <LandingNav />
      <main>
        <HeroSection />
        <ProvidersSection />
        <FeaturesSection />
        <DemoSection />
        <CapabilitiesSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
