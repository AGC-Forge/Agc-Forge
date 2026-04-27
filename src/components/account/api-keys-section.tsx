"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  saveApiKeySchema,
  type SaveApiKeyInput,
} from "@/lib/validations/account";
import {
  saveApiKeyAction,
  deleteApiKeyAction,
  toggleApiKeyAction,
  revealApiKeyAction,
} from "@/actions/account";
import { AI_MODEL_PROVIDERS } from "@/lib/aiProviders";
import { maskApiKey } from "@/lib/encryption";

interface ApiKeyRecord {
  id: string;
  provider: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiKeysSectionProps {
  apiKeys: ApiKeyRecord[];
}

// Provider options untuk dropdown
const PROVIDER_OPTIONS = [
  { value: "puter", label: "Puter.js (Auth Token)" },
  ...AI_MODEL_PROVIDERS.map((p) => ({ value: p.provider, label: p.label })),
];

function AddKeyForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SaveApiKeyInput>({
    resolver: zodResolver(saveApiKeySchema),
    defaultValues: { provider: "puter" },
  });

  const onSubmit = async (data: SaveApiKeyInput) => {
    setIsLoading(true);
    try {
      const result = await saveApiKeyAction(data);
      if (result.success) {
        toast.success(result.message ?? "API key saved successfully.");
        onSuccess();
      } else {
        toast.error(result.error ?? "Failed to save API key.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3"
    >
      <p className="text-xs font-medium text-indigo-300">Add new API Key</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Provider</Label>
          <select
            {...register("provider")}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 text-white text-sm px-2.5 focus:outline-none focus:border-indigo-500/50"
          >
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#111118]">
                {p.label}
              </option>
            ))}
          </select>
          {errors.provider && (
            <p className="text-xs text-red-400">{errors.provider.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">
            Label <span className="text-zinc-600">(optional)</span>
          </Label>
          <Input
            {...register("label")}
            placeholder="Name..."
            className="h-9 border-white/10 bg-white/5 text-white text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">API Key / Token</Label>
        <div className="relative">
          <Input
            {...register("api_key")}
            type={show ? "text" : "password"}
            placeholder="Paste API key..."
            className="h-9 border-white/10 bg-white/5 text-white text-sm font-mono pr-9"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.api_key && (
          <p className="text-xs text-red-400">{errors.api_key.message}</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-zinc-400"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          size="sm"
          className="h-7 bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Key Row ───────────────────────────────────────────────────────────────────

function ApiKeyRow({
  apiKey,
  onRefresh,
}: {
  apiKey: ApiKeyRecord;
  onRefresh: () => void;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const providerLabel =
    PROVIDER_OPTIONS.find((p) => p.value === apiKey.provider)?.label ??
    apiKey.provider;

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(null);
      return;
    }
    setIsRevealing(true);
    try {
      const result = await revealApiKeyAction(apiKey.provider);
      if (result.success && result.data) {
        setRevealed(result.data);
        // Auto-hide after 30 seconds
        setTimeout(() => setRevealed(null), 30000);
      } else {
        toast.error(result.error ?? "Failed to get reveal API key.");
      }
    } finally {
      setIsRevealing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteApiKeyAction(apiKey.provider);
      if (result.success) {
        toast.success(result.message);
        onRefresh();
      } else {
        toast.error(result.error ?? "Failed to delete API key.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleApiKeyAction(
        apiKey.provider,
        !apiKey.is_active,
      );
      if (result.success) {
        toast.success(result.message);
        onRefresh();
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 space-y-2 transition-all",
        apiKey.is_active
          ? "border-white/[0.07] bg-white/2.5"
          : "border-white/4 bg-white/1 opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Key className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {providerLabel}
            </p>
            {apiKey.label && (
              <p className="text-xs text-zinc-600">{apiKey.label}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Toggle active */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
            title={apiKey.is_active ? "Deactivate" : "Activate"}
          >
            {apiKey.is_active ? (
              <ToggleRight className="h-5 w-5 text-indigo-400" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>

          {/* Reveal */}
          <button
            onClick={handleReveal}
            disabled={isRevealing}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
            title="Tampilkan API key"
          >
            {isRevealing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : revealed ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Hapus"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Revealed key */}
      {revealed && (
        <div className="rounded-lg bg-black/30 border border-white/6 px-3 py-2 flex items-center gap-2">
          <code className="text-xs text-emerald-300 font-mono flex-1 break-all">
            {revealed}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(revealed);
              toast.success("Copied!");
            }}
            className="shrink-0 text-zinc-500 hover:text-zinc-200 text-xs"
          >
            Copy
          </button>
        </div>
      )}

      {/* Masked key */}
      {!revealed && (
        <p className="text-xs font-mono text-zinc-700 tracking-wider">
          ••••••••••••••••
        </p>
      )}

      <p className="text-[10px] text-zinc-700">
        Updated {new Date(apiKey.updated_at).toLocaleDateString("en-US")}
      </p>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export function ApiKeysSection({ apiKeys: initialKeys }: ApiKeysSectionProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [showForm, setShowForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    // Re-fetch via window.location.reload or router.refresh
    window.location.reload();
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">API Keys</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-white/10 bg-white/5 text-zinc-300 hover:text-white text-xs"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {showForm ? "Close" : "Add"}
        </Button>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed">
        Save your AI provider&apos;s API key. All keys are encrypted with
        AES-256-GCM before being stored in the database.
      </p>

      {showForm && (
        <AddKeyForm
          onSuccess={() => {
            setShowForm(false);
            refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {keys.length === 0 && !showForm ? (
        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-8 text-center">
          <Key className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-600">No API key saved.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer active:scale-95"
          >
            Add first API key
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {keys.map((k) => (
            <ApiKeyRow key={k.id} apiKey={k} onRefresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
