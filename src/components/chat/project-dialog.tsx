"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectSchema,
  PROJECT_COLORS,
  type CreateProjectInput,
} from "@/lib/validations/project";
import { cn } from "@/lib/utils";

// ── Quick emoji options ───────────────────────────────────────────────────────
const QUICK_EMOJIS = [
  "📁",
  "🚀",
  "💡",
  "🎯",
  "⚡",
  "🔥",
  "💻",
  "🌐",
  "📊",
  "🎨",
  "🔬",
  "📝",
  "🤖",
  "💬",
  "🛠️",
  "🌟",
];

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectInput) => Promise<boolean | any>;
  initialData?: Partial<CreateProjectInput>;
  mode?: "create" | "edit";
}

export function ProjectDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}: ProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      emoji: "📁",
      color: "#6366f1",
      system_prompt: "",
      ...initialData,
    },
  });

  const selectedColor =
    useWatch({
      control,
      name: "color",
      defaultValue: "#6366f1",
    }) || "#6366f1";

  const selectedEmoji =
    useWatch({
      control,
      name: "emoji",
      defaultValue: "📁",
    }) || "📁";

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        description: "",
        emoji: "📁",
        color: "#6366f1",
        system_prompt: "",
        ...initialData,
      });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: CreateProjectInput) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(data);
      if (result !== false) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[#111118] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-xl">{selectedEmoji}</span>
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* Name + Emoji row */}
          <div className="flex gap-3">
            {/* Emoji picker */}
            <div className="space-y-1.5 shrink-0">
              <Label className="text-xs text-zinc-400">Icon</Label>
              <div className="relative group">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl hover:bg-white/10 transition-all"
                >
                  {selectedEmoji}
                </button>
                {/* Emoji quick picker (hover) */}
                <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 rounded-xl border border-white/10 bg-[#0c0c12] shadow-2xl w-50 z-50">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setValue("emoji", em)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-all text-base"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="name" className="text-xs text-zinc-400">
                Project Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Research AI, Website Baru..."
                className="h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:border-indigo-500/50"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Color Label</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all ring-offset-2 ring-offset-[#111118]",
                    selectedColor === color
                      ? "ring-2 ring-white scale-110"
                      : "hover:scale-105",
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs text-zinc-400">
              Description <span className="text-zinc-600">(optional)</span>
            </Label>
            <Input
              id="description"
              placeholder="Project Description"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:border-indigo-500/50"
              {...register("description")}
            />
          </div>

          {/* System prompt */}
          <div className="space-y-1.5">
            <Label
              htmlFor="system_prompt"
              className="text-xs text-zinc-400 flex items-center gap-1.5"
            >
              <Wand2 className="h-3 w-3 text-indigo-400" />
              System Prompt{" "}
              <span className="text-zinc-600">
                (for all chat in this project)
              </span>
            </Label>
            <Textarea
              id="system_prompt"
              placeholder="Example: You are a React and TypeScript specialist. Always provide clean code examples following best practices..."
              rows={4}
              className="resize-none border-white/10 bg-white/5 text-white text-sm placeholder:text-zinc-600 focus-visible:border-indigo-500/50"
              {...register("system_prompt")}
            />
            {errors.system_prompt && (
              <p className="text-xs text-red-400">
                {errors.system_prompt.message}
              </p>
            )}
            <p className="text-[11px] text-zinc-600">
              System prompt will be sent to AI in this project conversation.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Project"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
