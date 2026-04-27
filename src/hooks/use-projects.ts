"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project";

interface ProjectItem {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
  system_prompt: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  conversations?: {
    id: string;
    title: string;
    skill: string;
    is_starred: boolean;
    is_pinned: boolean;
  }[];
  _count?: { conversations: number };
}

export function useProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Fetch gagal");
      const { data } = await res.json();
      setProjects(data ?? []);
    } catch (err) {
      console.error("[useProjects]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProjects();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchProjects]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const createProject = useCallback(
    async (data: CreateProjectInput): Promise<ProjectItem | null> => {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to create project");
        }
        const { data: project } = await res.json();
        setProjects((prev) => [project, ...prev]);
        toast.success(`Project "${project.name}" created!`);
        router.refresh();
        return project;
      } catch (err: any) {
        toast.error(err.message ?? "Failed to create project.");
        return null;
      }
    },
    [router]
  );

  // ── Update ─────────────────────────────────────────────────────────────────
  const updateProject = useCallback(
    async (id: string, data: Partial<UpdateProjectInput>): Promise<boolean> => {
      // Optimistic
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update project");
        toast.success("Project updated.");
        router.refresh();
        return true;
      } catch (err: any) {
        await fetchProjects(); // rollback
        toast.error(err.message ?? "Failed to update project.");
        return false;
      }
    },
    [fetchProjects, router]
  );

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteProject = useCallback(
    async (id: string, deleteConversations = false): Promise<boolean> => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      try {
        const url = `/api/projects/${id}${deleteConversations ? "?delete_conversations=true" : ""}`;
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete project");
        const { message } = await res.json();
        toast.success(message ?? "Project deleted.");
        router.refresh();
        return true;
      } catch (err: any) {
        await fetchProjects();
        toast.error(err.message ?? "Failed to delete project.");
        return false;
      }
    },
    [fetchProjects, router]
  );

  // ── Pin/Archive ────────────────────────────────────────────────────────────
  const togglePin = (id: string, pin: boolean) =>
    updateProject(id, { is_pinned: pin });

  const toggleArchive = (id: string, archive: boolean) =>
    updateProject(id, { is_archived: archive, ...(archive && { is_pinned: false }) });

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    togglePin,
    toggleArchive,
    refresh: fetchProjects,
  };
}
