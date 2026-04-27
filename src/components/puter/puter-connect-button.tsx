"use client";

import { usePuterAuth } from "@/components/puter/puter-auth-provider";
import { Button } from "@/components/ui/button";
import { Loader2, Unplug, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PuterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
    <rect width="32" height="32" rx="8" fill="#2563EB" />
    <path
      d="M8 10a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H10a2 2 0 01-2-2v-2zm0 8a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H10a2 2 0 01-2-2v-2z"
      fill="white"
      fillOpacity="0.9"
    />
  </svg>
);
export function PuterStatusBadge() {
  const { isConnected, puterUsername, isLoaded } = usePuterAuth();

  if (!isLoaded) return null;

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        <span className="text-xs text-emerald-300 font-medium truncate max-w-25">
          {puterUsername ?? "Puter"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1">
      <AlertCircle className="h-3 w-3 text-amber-400" />
      <span className="text-xs text-amber-300 font-medium">Puter offline</span>
    </div>
  );
}

interface PuterConnectCardProps {
  className?: string;
}

export function PuterConnectCard({ className }: PuterConnectCardProps) {
  const {
    isLoaded,
    isConnected,
    isConnecting,
    puterUsername,
    puterUid,
    connect,
    disconnect,
  } = usePuterAuth();

  const autoMode = process.env.NEXT_PUBLIC_PUTER_AUTO_TOKEN === "true";

  // Jika bukan auto mode, tampilkan info saja
  if (!autoMode) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 space-y-4",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Puter.js AI</h2>
          <span className="text-xs bg-zinc-800 text-zinc-400 rounded-full px-2 py-0.5">
            Static Token Mode
          </span>
        </div>
        <div className="rounded-xl border border-white/6 bg-white/2 px-4 py-3">
          <p className="text-sm text-zinc-400">
            Use{" "}
            <span className="text-white font-mono text-xs">
              PUTER_AUTH_TOKEN
            </span>{" "}
            from environment variables. Set{" "}
            <span className="text-white font-mono text-xs">
              PUTER_GET_AUTO_TOKEN_FROM_LOGGED_USER=true
            </span>{" "}
            to use mode per-user.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/2.5 p-6 space-y-5 transition-all",
        isConnected ? "border-emerald-500/20" : "border-white/[0.07]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
            <PuterIcon className="h-9 w-9" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Puter.js</h2>
            <p className="text-xs text-zinc-500">
              AI Provider — User Pays Model
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            isConnected
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-zinc-800 border border-white/5 text-zinc-500",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-600",
            )}
          />
          {isConnected ? "Terhubung" : "Tidak terhubung"}
        </div>
      </div>

      {/* Info */}
      <p className="text-xs text-zinc-500 leading-relaxed">
        Connect your Puter account to use 80+ AI models. Fees are covered by
        your Puter account — you get{" "}
        <span className="text-zinc-300 font-medium">
          25 million free tokens/month
        </span>{" "}
        from Puter.
      </p>

      {/* Connected state */}
      {isConnected && puterUsername && (
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-300 font-medium">
              Connected as <span className="font-mono">{puterUsername}</span>
            </span>
          </div>
          {puterUid && (
            <p className="text-[11px] text-zinc-600 font-mono pl-6">
              {puterUid}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="gap-2 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
          >
            <Unplug className="h-3.5 w-3.5" />
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={connect}
            disabled={isConnecting || !isLoaded}
            className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
          >
            {isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PuterIcon className="h-4 w-4" />
            )}
            {isConnecting ? "Connecting..." : "Connect Puter"}
          </Button>
        )}
      </div>

      {/* Usage hint */}
      {isConnected && (
        <p className="text-[11px] text-zinc-600">
          Token is encrypted. Session will be automatically renewed every time
          you open the application.
        </p>
      )}
    </div>
  );
}

export function PuterConnectButton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { isConnected, isConnecting, connect, isLoaded } = usePuterAuth();
  const autoMode = process.env.NEXT_PUBLIC_PUTER_AUTO_TOKEN === "true";

  if (!autoMode || isConnected) return null;

  return (
    <button
      onClick={connect}
      disabled={isConnecting || !isLoaded}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/8",
        "text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/30 transition-all text-xs",
        compact ? "px-2.5 py-1" : "px-3 py-1.5",
        className,
      )}
    >
      {isConnecting ? (
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
      ) : (
        <PuterIcon className="h-3.5 w-3.5 shrink-0" />
      )}
      {compact ? "Connect Puter" : "Connect Puter to use AI"}
    </button>
  );
}
