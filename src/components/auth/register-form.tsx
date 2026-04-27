"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthHeader } from "@/components/auth/auth-header";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

interface PasswordRule {
  label: string;
  test: (v: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Minimum 8 characters", test: (v) => v.length >= 8 },
  { label: "Contains uppercase letters", test: (v) => /[A-Z]/.test(v) },
  { label: "Contains numbers", test: (v) => /[0-9]/.test(v) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-1.5 text-xs">
            {ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            )}
            <span
              className={cn(
                "transition-colors",
                ok ? "text-zinc-400" : "text-zinc-600",
              )}
            >
              {rule.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });

  const onSubmit: SubmitHandler<RegisterInput> = async (
    data: RegisterInput,
  ) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await registerAction(formData);

      if (result.success) {
        setRegistered(data.email);
        toast.success("Account created! Check email verification.");
      } else {
        if (result.fieldErrors) {
          Object.values(result.fieldErrors)
            .flat()
            .forEach((msg) => toast.error(msg));
        } else {
          toast.error(result.error || "Registration failed.");
        }
      }
    } catch {
      toast.error("Error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">
            Check email verification!
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            We sent a verification link to{" "}
            <span className="text-white font-medium">{registered}</span>. Click
            the link to activate your account.
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          No email?{" "}
          <button
            onClick={() =>
              router.push(
                `/verify-email?email=${encodeURIComponent(registered)}`,
              )
            }
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            Resend link
          </button>
        </p>
        <Button
          onClick={() => router.push("/login")}
          variant="outline"
          className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Register new account"
        description="Free registration, start chat with AI now"
      />

      <SocialAuthButtons mode="register" />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthField
          label="Full name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          disabled={isLoading}
          error={errors.name?.message}
          {...register("name")}
        />

        <AuthField
          label="Email"
          type="email"
          placeholder="your.email@example.com"
          autoComplete="email"
          disabled={isLoading}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-1.5">
          <div className="relative">
            <AuthField
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={isLoading}
              error={errors.password?.message}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-8.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? "Hide" : "Show"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrength password={passwordValue} />
        </div>

        <div className="relative">
          <AuthField
            label="Konfirmasi password"
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            autoComplete="new-password"
            disabled={isLoading}
            error={errors.confirmPassword?.message}
            className="pr-10"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-8.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label={showConfirm ? "Hide" : "Show"}
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Create account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-zinc-600 leading-relaxed">
        By registering, you agree to{" "}
        <Link
          href="/terms"
          className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
        >
          Terms & Conditions
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
