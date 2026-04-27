"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthHeader } from "@/components/auth/auth-header";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { resetPasswordAction } from "@/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || "" },
  });

  // Token tidak ada di URL
  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-7 w-7 text-red-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Invalid link</h2>
          <p className="text-sm text-zinc-400">
            The password reset token is invalid. Please request a reset link.
          </p>
        </div>
        <Button
          onClick={() => router.push("/forgot-password")}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Request new link
        </Button>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">
            Password reset successfully!
          </h2>
          <p className="text-sm text-zinc-400">Please login now.</p>
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

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("token", data.token);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await resetPasswordAction(formData);

      if (result.success) {
        setSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        if (result.fieldErrors) {
          Object.values(result.fieldErrors)
            .flat()
            .forEach((msg) => toast.error(msg));
        } else {
          toast.error(result.error || "Failed to reset password.");
        }
      }
    } catch {
      toast.error("Error resetting password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AuthHeader
        title="Create a new password"
        description="New password must be different from the old one."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Hidden token field */}
        <input type="hidden" {...register("token")} />

        <div className="relative">
          <AuthField
            label="New password"
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Use at least 8 characters"
            autoComplete="new-password"
            disabled={isLoading}
            error={errors.password?.message}
            hint="Use at least 8 characters characters, uppercase letters, and numbers."
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-8.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="relative">
          <AuthField
            label="Confirm password"
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
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reset password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </div>
  );
}
