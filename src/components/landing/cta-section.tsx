import Link from "next/link";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-125 w-125 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 h-75 w-75 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
        {/* Logo */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-600/40 mb-8 mx-auto">
          <BrainCircuit className="h-8 w-8 text-white" />
        </div>

        <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white mb-6">
          Ready to use
          <br />
          <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Best AI model?
          </span>
        </h2>

        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Register now and explore more than 80 AI models — for chat, generate
          gambar, hingga video sinematik.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button
              size="lg"
              className="h-13 px-8 text-base bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-500/40 transition-all group"
            >
              Create a free account
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Already have an account? Login
            </Button>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600">
          {[
            "✓ Free to try",
            "✓ No credit card required",
            "✓ 10+ provider AI",
            "✓ Self-hosted friendly",
          ].map((badge) => (
            <span key={badge} className="text-zinc-500">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
