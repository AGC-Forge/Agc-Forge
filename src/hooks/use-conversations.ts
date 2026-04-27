"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationItem {
  id: string;
  title: string;
  skill: string;
  provider: string;
  model_id: string;
  is_starred: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  last_message_at: string | null;
  project_id: string | null;
  created_at: string;
}

interface UseConversationsOptions {
  projectId?: string;
  includeArchived?: boolean;
  search?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useConversations(options: UseConversationsOptions = {}) {
  const router = useRouter();
  const { projectId, includeArchived = false, search } = options;
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("project_id", projectId);
      if (includeArchived) params.set("archived", "true");
      if (search) params.set("q", search);

      const res = await fetch(`/api/conversations?${params}`);
      if (!res.ok) throw new Error("Fetch gagal");
      const { data } = await res.json();
      setConversations(data ?? []);
    } catch (err) {
      console.error("[useConversations]", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, includeArchived, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchConversations();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchConversations]);

  // ── Optimistic helpers ────────────────────────────────────────────────────

  const optimisticUpdate = (id: string, patch: Partial<ConversationItem>) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const optimisticRemove = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  // ── Mutation: sidebar action ───────────────────────────────────────────────

  const performAction = useCallback(
    async (
      id: string,
      action: ConversationSidebarAction,
      extra?: { title?: string; project_id?: string | null }
    ) => {
      // Optimistic
      if (action === "star") optimisticUpdate(id, { is_starred: true });
      else if (action === "unstar") optimisticUpdate(id, { is_starred: false });
      else if (action === "pin") optimisticUpdate(id, { is_pinned: true });
      else if (action === "unpin") optimisticUpdate(id, { is_pinned: false });
      else if (action === "archive") optimisticUpdate(id, { is_archived: true });
      else if (action === "unarchive") optimisticUpdate(id, { is_archived: false });
      else if (action === "rename" && extra?.title)
        optimisticUpdate(id, { title: extra.title });
      else if (action === "move_to_project" && extra?.project_id !== undefined)
        optimisticUpdate(id, { project_id: extra.project_id });
      else if (action === "remove_from_project")
        optimisticUpdate(id, { project_id: null });
      else if (action === "delete") optimisticRemove(id);

      try {
        const res = await fetch(`/api/conversations/${id}`, {
          method: action === "delete" ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          ...(action !== "delete" && {
            body: JSON.stringify({ action, ...extra }),
          }),
        });

        if (!res.ok) throw new Error(await res.text());

        const successMessages: Record<string, string> = {
          star: "Starred",
          unstar: "Unstarred",
          pin: "Pinned",
          unpin: "Unpin",
          archive: "Archived",
          unarchive: "Unarchived",
          rename: "Renamed",
          move_to_project: "Moved to project",
          remove_from_project: "Removed from project",
          delete: "Conversation deleted",
        };

        toast.success(successMessages[action] ?? "Success");
        startTransition(() => { router.refresh(); });
      } catch (err: any) {
        // Rollback optimistic
        await fetchConversations();
        toast.error(err.message ?? "Failed. Please try again.");
      }
    },
    [fetchConversations, router]
  );

  // ── Create new conversation ────────────────────────────────────────────────

  const createConversation = useCallback(
    async (data: {
      title: string;
      provider: string;
      model_id: string;
      skill: string;
      project_id?: string | null;
    }): Promise<string | null> => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Failed to create conversation");
        const { data: conv } = await res.json();
        await fetchConversations();
        return conv.id;
      } catch (err: any) {
        toast.error(err.message ?? "Failed to create conversation.");
        return null;
      }
    },
    [fetchConversations]
  );

  // ── Derived lists ──────────────────────────────────────────────────────────

  const pinned = conversations.filter(
    (c) => c.is_pinned && !c.is_archived && !c.project_id
  );
  const starred = conversations.filter(
    (c) => c.is_starred && !c.is_pinned && !c.is_archived && !c.project_id
  );
  const recent = conversations.filter(
    (c) => !c.is_pinned && !c.is_starred && !c.is_archived && !c.project_id
  );
  const archived = conversations.filter((c) => c.is_archived);

  return {
    conversations,
    pinned,
    starred,
    recent,
    archived,
    isLoading,
    isPending,
    performAction,
    createConversation,
    refresh: fetchConversations,
  };
}
