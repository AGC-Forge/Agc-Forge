"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Settings,
  Globe,
  ShieldCheck,
  Cpu,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Check,
  Save,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  appSettingsSchema,
  type AppSettingsInput,
} from "@/lib/validations/account";
import { updateAppSettingsAction } from "@/actions/settings";
import { AI_MODEL_PROVIDERS } from "@/lib/aiProviders";
import { cn } from "@/lib/utils";

// ── Toggle Row ────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  accent = "indigo",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: "indigo" | "emerald" | "amber" | "red";
}) {
  const colors = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/4 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-zinc-300">{label}</p>
        {description && (
          <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn("shrink-0 transition-colors", colors[accent])}
        role="switch"
        aria-checked={checked}
      >
        {checked ? (
          <ToggleRight className="h-6 w-6" />
        ) : (
          <ToggleLeft className="h-6 w-6 text-zinc-600" />
        )}
      </button>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  children,
  accent = "text-indigo-400",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4", accent)} />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Main Settings Form ────────────────────────────────────────────────────────

interface SettingsFormProps {
  currentSettings: Record<string, string>;
  isAdmin: boolean;
}

export function SettingsForm({ currentSettings, isAdmin }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AppSettingsInput>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      site_name: currentSettings.site_name ?? "AI Chat",
      site_description: currentSettings.site_description ?? "",
      is_maintenance: currentSettings.is_maintenance === "true",
      enable_register: currentSettings.enable_register !== "false",
      enable_github_provider:
        currentSettings.enable_github_provider !== "false",
      enable_google_provider:
        currentSettings.enable_google_provider !== "false",
      default_provider: currentSettings.default_provider ?? "anthropic",
      default_model_id: currentSettings.default_model_id ?? "claude-sonnet-4",
    },
  });

  const [
    isMaintenance,
    enableRegister,
    enableGithubProvider,
    enableGoogleProvider,
    defaultProvider,
  ] = useWatch({
    control,
    name: [
      "is_maintenance",
      "enable_register",
      "enable_github_provider",
      "enable_google_provider",
      "default_provider",
    ],
  });

  const allValues = useWatch({ control });

  const defaultProviderModels =
    AI_MODEL_PROVIDERS.find(
      (p) => p.provider === defaultProvider,
    )?.models.filter((m) => m.skill === "text") ?? [];

  const onSubmit = async (data: AppSettingsInput) => {
    setIsLoading(true);
    try {
      const result = await updateAppSettingsAction(data);
      if (result.success) {
        setSaved(true);
        toast.success(result.message ?? "Settings saved.");
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(result.error ?? "Failed to save settings.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-300">
            Restricted access
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Only admin can change application settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* General settings */}
      <SectionCard icon={Globe} title="General">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="site_name" className="text-xs text-zinc-400">
              Application name
            </Label>
            <Input
              id="site_name"
              {...register("site_name")}
              className="h-9 border-white/10 bg-white/5 text-white text-sm focus-visible:border-indigo-500/50"
            />
            {errors.site_name && (
              <p className="text-xs text-red-400">{errors.site_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="site_description" className="text-xs text-zinc-400">
              Application description
            </Label>
            <Textarea
              id="site_description"
              {...register("site_description")}
              rows={2}
              className="resize-none border-white/10 bg-white/5 text-white text-sm focus-visible:border-indigo-500/50"
            />
          </div>

          <div className="pt-2">
            <ToggleRow
              label="Maintenance mode"
              description="Disable access for all users except admin"
              checked={isMaintenance}
              onChange={(v) =>
                setValue("is_maintenance", v, { shouldDirty: true })
              }
              accent="amber"
            />
          </div>
        </div>
      </SectionCard>

      {/* Auth settings */}
      <SectionCard
        icon={ShieldCheck}
        title="Authentication"
        accent="text-emerald-400"
      >
        <div>
          <ToggleRow
            label="Open registration"
            description="Allow new users to register"
            checked={enableRegister}
            onChange={(v) =>
              setValue("enable_register", v, { shouldDirty: true })
            }
            accent="emerald"
          />
          <ToggleRow
            label="Login with GitHub"
            description="Enable GitHub OAuth provider"
            checked={enableGithubProvider}
            onChange={(v) =>
              setValue("enable_github_provider", v, { shouldDirty: true })
            }
          />
          <ToggleRow
            label="Login with Google"
            description="Enable Google OAuth provider"
            checked={enableGoogleProvider}
            onChange={(v) =>
              setValue("enable_google_provider", v, { shouldDirty: true })
            }
          />
        </div>
      </SectionCard>

      {/* AI default settings */}
      <SectionCard icon={Cpu} title="AI Default" accent="text-violet-400">
        <p className="text-xs text-zinc-600">
          The default model used when a conversation is created.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Default provider</Label>
            <select
              {...register("default_provider")}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 text-white text-sm px-2.5 focus:outline-none focus:border-indigo-500/50"
            >
              {AI_MODEL_PROVIDERS.filter((p) =>
                p.models.some((m) => m.skill === "text"),
              ).map((p) => (
                <option
                  key={p.provider}
                  value={p.provider}
                  className="bg-[#111118]"
                >
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Default Model</Label>
            <select
              {...register("default_model_id")}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 text-white text-sm px-2.5 focus:outline-none focus:border-indigo-500/50"
            >
              {defaultProviderModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#111118]">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          className={cn(
            "h-9 px-5 gap-2 transition-all",
            saved
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20",
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" /> Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
