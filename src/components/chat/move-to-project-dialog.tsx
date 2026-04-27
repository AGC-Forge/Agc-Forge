"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProjectOption {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
}

interface MoveToProjectDialogProps {
  open: boolean;
  onClose: () => void;
  currentProjectId?: string | null;
  onSelect: (projectId: string | null) => Promise<void>;
}

export function MoveToProjectDialog({
  open,
  onClose,
  currentProjectId,
  onSelect,
}: MoveToProjectDialogProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(
    currentProjectId ?? null,
  );
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Loading state is already set to true by default, so no need to set it here
    fetch("/api/projects")
      .then((r) => r.json())
      .then(({ data }) => setProjects(data ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [open]);

  const handleConfirm = async () => {
    setIsMoving(true);
    try {
      await onSelect(selected);
      onClose();
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-[#111118] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-indigo-400" />
            Move to Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 py-1 max-h-75 overflow-y-auto">
          {/* None option */}
          <button
            onClick={() => setSelected(null)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
              selected === null
                ? "bg-indigo-600/15 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5",
            )}
          >
            <span className="text-base leading-none">📋</span>
            <span className="flex-1 text-left">Without project (Recent)</span>
            {selected === null && (
              <Check className="h-3.5 w-3.5 text-indigo-400" />
            )}
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 text-zinc-600 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-600">
              No projects. Create a project first.
            </p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelected(project.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  selected === project.id
                    ? "bg-indigo-600/15 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5",
                )}
              >
                <span className="text-base leading-none">
                  {project.emoji ?? "📁"}
                </span>
                <span className="flex-1 text-left truncate">
                  {project.name}
                </span>
                {project.color && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                {selected === project.id && (
                  <Check className="h-3.5 w-3.5 text-indigo-400" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isMoving || isLoading}
            className="flex-1 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isMoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Move
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
