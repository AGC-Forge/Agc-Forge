"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/account";
import { changePasswordAction, deleteAccountAction } from "@/actions/account";

interface SecuritySectionProps {
  hasPassword: boolean;
}

function PasswordInput({
  id,
  label,
  show,
  toggle,
  reg,
  error,
}: {
  id: string;
  label: string;
  show: boolean;
  toggle: () => void;
  reg: any;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-zinc-400">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          {...reg}
          className="h-9 border-white/10 bg-white/5 text-white text-sm pr-9 focus-visible:border-indigo-500/50"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={toggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function SecuritySection({ hasPassword }: SecuritySectionProps) {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async (data: ChangePasswordInput) => {
    setIsLoading(true);
    try {
      const result = await changePasswordAction(data);
      if (result.success) {
        toast.success(result.message ?? "Password changed.");
        reset();
      } else {
        if (result.fieldErrors) {
          Object.values(result.fieldErrors)
            .flat()
            .forEach((e) => toast.error(e));
        } else {
          toast.error(result.error ?? "Failed to change password.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccountAction(deletePassword || undefined);
      if (result.success) {
        toast.success("Account deleted.");
        await signOut({ callbackUrl: "/" });
      } else {
        toast.error(result.error ?? "Failed to delete account.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Security</h2>
        </div>

        {/* Change password */}
        {hasPassword ? (
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            <p className="text-xs text-zinc-500">Change password</p>

            <PasswordInput
              id="current_password"
              label="Current password"
              show={showCurrent}
              toggle={() => setShowCurrent((v) => !v)}
              reg={register("current_password")}
              error={errors.current_password?.message}
            />
            <PasswordInput
              id="new_password"
              label="New password"
              show={showNew}
              toggle={() => setShowNew((v) => !v)}
              reg={register("new_password")}
              error={errors.new_password?.message}
            />
            <PasswordInput
              id="confirm_password"
              label="Confirm new password"
              show={showConfirm}
              toggle={() => setShowConfirm((v) => !v)}
              reg={register("confirm_password")}
              error={errors.confirm_password?.message}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Change password"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-white/6 bg-white/2 px-4 py-3">
            <p className="text-sm text-zinc-500">
              This account uses social login (OAuth). No password needs to be
              changed.
            </p>
          </div>
        )}

        {/* Danger zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm font-medium text-red-300">Danger zone</p>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Deleting account is permanent. All data will be deleted.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50"
            onClick={() => setDeleteOpen(true)}
          >
            Delete account
          </Button>
        </div>
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm bg-[#111118] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Delete account confirm
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Delete account is permanent. All data will be deleted.
              <span className="text-white font-medium">cannot be undone</span>
            </p>
            {hasPassword && (
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">
                  Confirm password
                </Label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Password kamu"
                  className="h-9 border-white/10 bg-white/5 text-white text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || (hasPassword && !deletePassword)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Yes, delete account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
