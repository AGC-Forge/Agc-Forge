"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthHeader } from "@/components/auth/auth-header";
import { verifyEmailAction, resendVerificationAction } from "@/actions/auth";

type VerifyState = "idle" | "loading" | "success" | "error" | "resend";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const [state, setState] = useState<VerifyState>(token ? "loading" : "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // Auto-verify jika token ada di URL
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setState("loading");
      try {
        const result = await verifyEmailAction(token);
        if (result.success) {
          setState("success");
        } else {
          setState("error");
          setErrorMsg(result.error || "Verification failed.");
        }
      } catch {
        setState("error");
        setErrorMsg("An error occurred during verification.");
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!email || resendSent) return;
    setResendLoading(true);
    try {
      const result = await resendVerificationAction(email);
      if (result.success) {
        setResendSent(true);
        toast.success("Link verification sent again!");
      } else {
        toast.error(result.error || "Failed to resend verification link.");
      }
    } catch {
      toast.error("An error occurred during verification resend.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
        <p className="text-sm text-zinc-400">Email verification...</p>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Email verified!</h2>
          <p className="text-sm text-zinc-400">
            Account activated. Welcome aboard!
          </p>
        </div>
        <Button
          onClick={() => router.push("/login")}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Login now
        </Button>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Verification failed
            </h2>
            <p className="text-sm text-zinc-400">{errorMsg}</p>
          </div>
        </div>

        {/* Resend section */}
        <div className="space-y-3 border-t border-white/5 pt-4">
          <p className="text-xs text-zinc-500 text-center">
            Request new verification link:
          </p>
          {!resendSent ? (
            <>
              <AuthField
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleResend}
                disabled={resendLoading || !email}
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                {resendLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Resend verification link
              </Button>
            </>
          ) : (
            <p className="text-sm text-emerald-400 text-center">
              ✓ Verification link sent to: {email}
            </p>
          )}
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Login now
        </Link>
      </div>
    );
  }

  // ── Idle: tidak ada token, tampilkan form resend ──────────────────────────
  return (
    <div>
      <AuthHeader
        title="Verify your email"
        description="We've sent a verification link to your email"
      />

      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
          <Mail className="h-7 w-7 text-indigo-400" />
        </div>
        <p className="text-sm text-zinc-400 text-center leading-relaxed">
          Open your email and click the verification link. Check the{" "}
          <strong className="text-zinc-300">Spam</strong> folder if it&apos;s
          not in the inbox.
        </p>
      </div>

      {!resendSent ? (
        <div className="space-y-3 mt-2">
          <AuthField
            label="Email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={handleResend}
            disabled={resendLoading || !email}
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            {resendLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Resend verification link
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-sm text-emerald-400 text-center">
            ✓ Verification link sent to: {email}
          </p>
        </div>
      )}

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        Login now
      </Link>
    </div>
  );
}
