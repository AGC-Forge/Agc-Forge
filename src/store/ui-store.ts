import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      activeConversationId: null,
      activeProjectId: null,
      setActiveConversation: (id) => set({ activeConversationId: id }),
      setActiveProject: (id) => set({ activeProjectId: id }),

      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      showArchived: false,
      setShowArchived: (v) => set({ showArchived: v }),
    }),
    {
      name: "ui-store",
      partialize: (s) => ({
        sidebarOpen: s.sidebarOpen,
        showArchived: s.showArchived,
      }),
    }
  )
);
