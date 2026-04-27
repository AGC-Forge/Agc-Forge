"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search, Zap, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/model-store";
import { AI_MODEL_PROVIDERS } from "@/lib/aiProviders";

// ── Provider accent colors ────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<AIProvider, string> = {
  anthropic: "#D97706",
  openai: "#10B981",
  google: "#3B82F6",
  xai: "#8B5CF6",
  deepseek: "#06B6D4",
  bytedance: "#F59E0B",
  kling: "#EC4899",
  qwen: "#6366F1",
  wanai: "#14B8A6",
  pixverse: "#F97316",
};

export function ModelSelector() {
  const {
    selectedProvider,
    selectedModel,
    activeSkill,
    setProvider,
    setModel,
  } = useModelStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter providers dan models berdasarkan activeSkill + search
  const filteredProviders = useMemo(() => {
    return AI_MODEL_PROVIDERS.map((p) => ({
      ...p,
      models: p.models.filter(
        (m) =>
          m.skill === activeSkill &&
          (search === "" ||
            m.label.toLowerCase().includes(search.toLowerCase()) ||
            p.label.toLowerCase().includes(search.toLowerCase())),
      ),
    })).filter((p) => p.models.length > 0);
  }, [activeSkill, search]);

  const accentColor = PROVIDER_COLORS[selectedProvider] ?? "#6366F1";

  const handleSelect = (provider: AIProvider, model: AIModel) => {
    setProvider(provider);
    setModel(model);
    setOpen(false);
    setSearch("");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg border border-white/8 bg-white/3",
            "px-3 py-1.5 text-sm transition-all hover:bg-white/6 hover:border-white/12",
            "focus:outline-none focus:ring-1 focus:ring-indigo-500/40",
          )}
        >
          {/* Provider dot */}
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />

          {/* Model name */}
          <span className="text-zinc-200 font-medium truncate max-w-35 sm:max-w-50">
            {selectedModel?.label ?? "Select model"}
          </span>

          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-zinc-500 transition-transform shrink-0",
              open && "rotate-180",
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 p-0 bg-[#111118] border-white/10 shadow-2xl shadow-black/50"
        sideOffset={6}
      >
        {/* Search */}
        <div className="p-2 border-b border-white/6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <Input
              placeholder="Search model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 bg-white/5 border-white/8 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/40"
              autoFocus
            />
          </div>
        </div>

        {/* Model list */}
        <div className="max-h-90 overflow-y-auto py-1">
          {filteredProviders.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-600">
              No models for{" "}
              <span className="text-zinc-400 font-medium">{activeSkill}</span>
              {search && ` with keyword "${search}"`}
            </div>
          ) : (
            filteredProviders.map((provider, pi) => (
              <div key={provider.provider}>
                {pi > 0 && (
                  <DropdownMenuSeparator className="bg-white/4 my-1" />
                )}
                {/* Provider label */}
                <DropdownMenuLabel className="flex items-center gap-2 px-3 py-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: PROVIDER_COLORS[provider.provider],
                    }}
                  />
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {provider.label}
                  </span>
                </DropdownMenuLabel>

                {/* Models */}
                {provider.models.map((model) => {
                  const isSelected =
                    selectedModel?.id === model.id &&
                    selectedProvider === provider.provider;

                  return (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => handleSelect(provider.provider, model)}
                      className={cn(
                        "flex items-center justify-between gap-2 mx-1 rounded-md px-3 py-2 cursor-pointer",
                        "text-zinc-300 hover:text-white focus:text-white",
                        "hover:bg-white/5 focus:bg-white/5",
                        isSelected && "bg-indigo-600/15 text-white",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Zap
                          className="h-3.5 w-3.5 shrink-0"
                          style={{
                            color: PROVIDER_COLORS[provider.provider],
                          }}
                        />
                        <span className="text-sm truncate">{model.label}</span>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-white/6 px-3 py-2">
          <p className="text-[11px] text-zinc-600">
            Showing model for skill{" "}
            <span className="text-zinc-400 font-medium capitalize">
              {activeSkill}
            </span>
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
