"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        <Label htmlFor={fieldId} className="text-sm font-medium text-zinc-300">
          {label}
        </Label>
        <Input
          ref={ref}
          id={fieldId}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          aria-invalid={!!error}
          className={cn(
            "h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600",
            "focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20",
            "transition-colors",
            error &&
              "border-red-500/60 focus-visible:border-red-500 focus-visible:ring-red-500/20",
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-xs text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";
