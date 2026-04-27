"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, User, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/account";
import { updateProfileAction } from "@/actions/account";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    role: { name: string; level: number };
    email_verified: boolean;
    has_password: boolean;
    accounts: { provider: string }[];
    _count: { conversations: number; projects: number };
    last_login_at?: string | null;
    created_at: string;
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    try {
      const result = await updateProfileAction(data);
      if (result.success) {
        setSaved(true);
        toast.success(result.message ?? "Profile updated.");
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        if (result.fieldErrors) {
          Object.values(result.fieldErrors)
            .flat()
            .forEach((e) => toast.error(e));
        } else {
          toast.error(result.error ?? "Failed.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const oauthProviders = user.accounts.map((a) => a.provider);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-1">
        <User className="h-4 w-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Profile</h2>
      </div>

      {/* Avatar + stats */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar className="h-16 w-16 ring-2 ring-white/10">
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback className="bg-indigo-600 text-white text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white truncate">
            {user.name}
          </p>
          <p className="text-sm text-zinc-500 truncate">{user.email}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 rounded-full px-2 py-0.5 capitalize">
              {user.role.name}
            </span>
            {user.email_verified && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Conversations", value: user._count.conversations },
          { label: "Projects", value: user._count.projects },
          {
            label: "Last login",
            value: user.last_login_at
              ? new Date(user.last_login_at).toLocaleDateString("en-US")
              : "—",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/6 bg-white/2 px-3 py-2.5 text-center"
          >
            <p className="text-lg font-semibold text-white">{stat.value}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* OAuth providers */}
      {oauthProviders.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">Connected accounts</p>
          <div className="flex gap-2">
            {oauthProviders.map((p) => (
              <span
                key={p}
                className="text-xs bg-white/5 border border-white/8 text-zinc-300 rounded-lg px-2.5 py-1 capitalize"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 pt-2 border-t border-white/5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-zinc-400">
            Full name
          </Label>
          <Input
            id="name"
            {...register("name")}
            className="h-9 border-white/10 bg-white/5 text-white text-sm focus-visible:border-indigo-500/50"
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Email</Label>
          <Input
            value={user.email}
            readOnly
            className="h-9 border-white/10 bg-white/2 text-zinc-500 text-sm cursor-not-allowed"
          />
          <p className="text-[11px] text-zinc-600">Email cannot be changed.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs text-zinc-400">
            Phone number <span className="text-zinc-600">(optional)</span>
          </Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="+1323xxxxxx"
            className="h-9 border-white/10 bg-white/5 text-white text-sm focus-visible:border-indigo-500/50"
          />
          {errors.phone && (
            <p className="text-xs text-red-400">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="avatar" className="text-xs text-zinc-400">
            Avatar URL <span className="text-zinc-600">(optional)</span>
          </Label>
          <Input
            id="avatar"
            {...register("avatar")}
            placeholder="https://..."
            className="h-9 border-white/10 bg-white/5 text-white text-sm focus-visible:border-indigo-500/50"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={isLoading || !isDirty}
            size="sm"
            className={cn(
              "h-8 px-4 transition-all",
              saved
                ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
