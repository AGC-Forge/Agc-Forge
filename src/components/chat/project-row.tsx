"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pin,
  PinOff,
  Archive,
  Pencil,
  Trash2,
  MoreHorizontal,
  FolderOpen,
  ChevronRight,
  FolderPlus,
} from "lucide-react";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/chat/project-dialog";
import { cn } from "@/lib/utils";

interface ProjectItem {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description?: string | null;
  system_prompt?: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  conversations?: { id: string; title: string; skill: string }[];
  _count?: { conversations: number };
}

interface ProjectRowProps {
  project: ProjectItem;
  isActive?: boolean;
  onRefresh: () => void;
}

export function ProjectRow({ project, isActive, onRefresh }: ProjectRowProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePatch = async (data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      onRefresh();
    } catch {
      toast.error("Gagal. Coba lagi.");
    }
  };

  const handleDelete = async (deleteConversations: boolean) => {
    setIsDeleting(true);
    try {
      const url = `/api/projects/${project.id}${deleteConversations ? "?delete_conversations=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const { message } = await res.json();
      toast.success(message);
      setDeleteOpen(false);
      router.refresh();
      onRefresh();
    } catch {
      toast.error("Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (data: any) => {
    await handlePatch(data);
    setEditOpen(false);
    return true;
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            "group h-8 gap-2 rounded-lg pr-8 text-zinc-400 hover:text-white hover:bg-white/5",
            "data-[active=true]:bg-white/8 data-[active=true]:text-white",
          )}
        >
          <Link href={`/chat?project=${project.id}`}>
            <span className="text-base leading-none shrink-0">
              {project.emoji ?? "📁"}
            </span>
            <span className="truncate text-sm flex-1">{project.name}</span>
            {project._count?.conversations != null &&
              project._count.conversations > 0 && (
                <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">
                  {project._count.conversations}
                </span>
              )}
            {project.is_pinned && (
              <Pin className="h-2.5 w-2.5 text-zinc-600 shrink-0" />
            )}
          </Link>
        </SidebarMenuButton>

        {/* Context menu */}
        <SidebarMenuAction showOnHover asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Project options"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              className="w-48 bg-[#111118] border-white/10"
            >
              <DropdownMenuItem
                className="gap-2 text-zinc-300 hover:text-white focus:text-white"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Project
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2 text-zinc-300 hover:text-white focus:text-white"
                onClick={() => handlePatch({ is_pinned: !project.is_pinned })}
              >
                {project.is_pinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5" /> Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5" /> Pin
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/5" />

              <DropdownMenuItem
                className="gap-2 text-zinc-300 hover:text-white focus:text-white"
                onClick={() => handlePatch({ is_archived: true })}
              >
                <Archive className="h-3.5 w-3.5" /> Archive Project
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/5" />

              <DropdownMenuItem
                className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuAction>
      </SidebarMenuItem>

      {/* Edit Dialog */}
      <ProjectDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        mode="edit"
        initialData={{
          name: project.name,
          emoji: project.emoji ?? "📁",
          color: project.color ?? "#6366f1",
          description: project.description ?? "",
          system_prompt: project.system_prompt ?? "",
        }}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm bg-[#111118] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Delete project?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Project{" "}
            <span className="text-white font-medium">
              &quot;{project.name}&quot;
            </span>{" "}
            will be deleted.
            {(project._count?.conversations ?? 0) > 0 && (
              <>
                {" "}
                There are{" "}
                <span className="text-white font-medium">
                  {project._count?.conversations} conversation
                </span>{" "}
                in this project.
              </>
            )}
          </p>
          {(project._count?.conversations ?? 0) > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                disabled={isDeleting}
                onClick={() => handleDelete(false)}
              >
                Delete project, keep conversations
              </Button>
              <Button
                className="w-full bg-red-600 hover:bg-red-500 text-white"
                disabled={isDeleting}
                onClick={() => handleDelete(true)}
              >
                Delete project + all conversations
              </Button>
            </div>
          )}
          {(project._count?.conversations ?? 0) === 0 && (
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteOpen(false)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500 text-white"
                disabled={isDeleting}
                onClick={() => handleDelete(false)}
              >
                Delete
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
