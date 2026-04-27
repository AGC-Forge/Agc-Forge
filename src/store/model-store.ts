import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AI_MODEL_PROVIDERS } from "@/lib/aiProviders";

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      selectedProvider: "anthropic",
      selectedModel: AI_MODEL_PROVIDERS[0]?.models[0] ?? null,
      activeSkill: "text",

      setProvider: (provider) => {
        const providerData = AI_MODEL_PROVIDERS.find((p) => p.provider === provider);
        const { activeSkill } = get();

        // Cari model pertama yang cocok dengan skill aktif di provider baru
        const matchedModel =
          providerData?.models.find((m) => m.skill === activeSkill) ??
          providerData?.models[0] ??
          null;

        set({ selectedProvider: provider, selectedModel: matchedModel });
      },

      setModel: (model) => set({ selectedModel: model }),

      setSkill: (skill) => {
        const { selectedProvider } = get();
        const providerData = AI_MODEL_PROVIDERS.find(
          (p) => p.provider === selectedProvider
        );

        // Cari model pertama yang cocok dengan skill baru
        const matchedModel =
          providerData?.models.find((m) => m.skill === skill) ?? null;

        set({
          activeSkill: skill,
          selectedModel: matchedModel,
          // Jika model tidak ditemukan di provider ini, reset ke provider yang punya model tersebut
          ...(matchedModel === null && { selectedProvider: "anthropic" }),
        });
      },

      getFilteredModels: () => {
        const { selectedProvider, activeSkill } = get();
        const providerData = AI_MODEL_PROVIDERS.find(
          (p) => p.provider === selectedProvider
        );
        return providerData?.models.filter((m) => m.skill === activeSkill) ?? [];
      },

      autoSelectModel: (skill) => {
        // Cari provider + model pertama yang punya skill ini
        for (const provider of AI_MODEL_PROVIDERS) {
          const model = provider.models.find((m) => m.skill === skill);
          if (model) {
            set({
              activeSkill: skill,
              selectedProvider: provider.provider,
              selectedModel: model,
            });
            return;
          }
        }
      },
    }),
    {
      name: "model-store",
      // Hanya persist fields yang dibutuhkan
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
        activeSkill: state.activeSkill,
      }),
    }
  )
);
