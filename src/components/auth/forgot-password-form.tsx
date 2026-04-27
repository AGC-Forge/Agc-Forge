"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthHeader } from "@/components/auth/auth-header";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      const result = await forgotPasswordAction(formData);

      if (result.success) {
        setSubmittedEmail(data.email);
        setSubmitted(true);
      } else {
        toast.error(result.error || "Failed to send reset email.");
      }
    } catch {
      toast.error("Error sending reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
          <MailCheck className="h-7 w-7 text-indigo-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">
            Check email address
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            If <span className="text-white font-medium">{submittedEmail}</span>{" "}
            is registered with us, we have sent a link to reset your password.
            Link expires in 1 hour.
          </p>
        </div>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
          className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          Resend link
        </Button>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Forgot password?"
        description="Enter your email and we will send you a link to reset your password"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthField
          label="Email"
          type="email"
          placeholder="your.email@example.com"
          autoComplete="email"
          disabled={isLoading}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending email...
            </>
          ) : (
            "Send link reset"
          )}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to login
      </Link>
    </div>
  );
}
