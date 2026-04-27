import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  FolderOpen,
  Star,
  History,
  Upload,
  Zap,
  Shield,
  Layers,
  BarChart2,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  large?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    title: "Chat AI Streaming",
    description:
      "Real-time streaming with token-by-token responses. Supports long contexts, multi-turn conversations, and per-project system prompts.",
    accent: "indigo",
    large: true,
  },
  {
    icon: ImageIcon,
    title: "Generate Image",
    description:
      "Choose aspect ratio, quality up to 4K, and best model for visual content.",
    accent: "violet",
  },
  {
    icon: Video,
    title: "Generate Video",
    description: "Generate video up to 30 seconds. Feature to Extend Video.",
    accent: "cyan",
  },
  {
    icon: FolderOpen,
    title: "Projects",
    description:
      "Manage conversations within projects. Custom per-project system prompts. Similar to Claude Projects.",
    accent: "emerald",
  },
  {
    icon: Star,
    title: "Smart Sidebar",
    description:
      "Pin, star, archive, rename, or delete conversation from sidebar.",
    accent: "amber",
    large: true,
  },
  {
    icon: Upload,
    title: "Upload File",
    description:
      "Upload images, PDFs, code, documents, audio, and videos to AI. Securely stored in MinIO.",
    accent: "rose",
  },
  {
    icon: Zap,
    title: "Multi-Provider",
    description:
      "Replace AI model anytime in a conversation. Each optimized for its task.",
    accent: "orange",
  },
  {
    icon: Shield,
    title: "Secure",
    description:
      "Data encrypted in database. API key stored encrypted. Self-hosted friendly.",
    accent: "teal",
  },
];

const ACCENT_CLASSES: Record<
  string,
  { icon: string; glow: string; border: string }
> = {
  indigo: {
    icon: "bg-indigo-600/15 text-indigo-400 border-indigo-500/20",
    glow: "group-hover:shadow-indigo-500/10",
    border: "hover:border-indigo-500/20",
  },
  violet: {
    icon: "bg-violet-600/15 text-violet-400 border-violet-500/20",
    glow: "group-hover:shadow-violet-500/10",
    border: "hover:border-violet-500/20",
  },
  cyan: {
    icon: "bg-cyan-600/15 text-cyan-400 border-cyan-500/20",
    glow: "group-hover:shadow-cyan-500/10",
    border: "hover:border-cyan-500/20",
  },
  emerald: {
    icon: "bg-emerald-600/15 text-emerald-400 border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/10",
    border: "hover:border-emerald-500/20",
  },
  amber: {
    icon: "bg-amber-600/15 text-amber-400 border-amber-500/20",
    glow: "group-hover:shadow-amber-500/10",
    border: "hover:border-amber-500/20",
  },
  rose: {
    icon: "bg-rose-600/15 text-rose-400 border-rose-500/20",
    glow: "group-hover:shadow-rose-500/10",
    border: "hover:border-rose-500/20",
  },
  orange: {
    icon: "bg-orange-600/15 text-orange-400 border-orange-500/20",
    glow: "group-hover:shadow-orange-500/10",
    border: "hover:border-orange-500/20",
  },
  teal: {
    icon: "bg-teal-600/15 text-teal-400 border-teal-500/20",
    glow: "group-hover:shadow-teal-500/10",
    border: "hover:border-teal-500/20",
  },
};

function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon, title, description, accent, large } = feature;
  const cls = ACCENT_CLASSES[accent];

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/[0.07] bg-white/2.5",
        "p-6 transition-all duration-300 hover:border-white/12 hover:bg-white/4",
        "hover:shadow-xl",
        cls.glow,
        cls.border,
        large && "md:col-span-2",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border mb-4 transition-transform group-hover:scale-110",
          cls.icon,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>

      {/* Decorative corner glow */}
      <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div
          className="absolute top-0 right-0 h-24 w-24 rounded-bl-full"
          style={{
            background: `radial-gradient(circle at top right, ${
              accent === "indigo"
                ? "rgba(99,102,241,0.08)"
                : accent === "violet"
                  ? "rgba(139,92,246,0.08)"
                  : accent === "cyan"
                    ? "rgba(6,182,212,0.08)"
                    : accent === "emerald"
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(245,158,11,0.08)"
            }, transparent 70%)`,
          }}
        />
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24">
      {/* Top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-3">
            Full Features
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Everything you need
          </h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            From project management to multi-modal AI generation in one
            workflow.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
