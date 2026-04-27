import * as z from "zod"

// ── Warna yang diizinkan untuk project label ──────────────────────────────────
export const PROJECT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#64748b", // slate
] as const;

// ── Create Project ────────────────────────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required field.")
    .min(2, "Project name must be at least 2 characters.")
    .max(100, "Project name must be at most 100 characters.")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters.")
    .optional()
    .or(z.literal("")),
  emoji: z
    .string()
    .max(10, "Emoji is too long.")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format.")
    .optional()
    .or(z.literal("")),
  system_prompt: z
    .string()
    .max(4000, "System prompt must be at most 4000 characters.")
    .optional()
    .or(z.literal("")),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ── Update Project ────────────────────────────────────────────────────────────
export const updateProjectSchema = createProjectSchema.extend({
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ── Create Conversation (via UI form) ─────────────────────────────────────────
export const createConversationSchema = z.object({
  title: z.string().min(1, "Title is required field.").max(200).trim(),
  provider: z.string().min(1, "Provider is required field."),
  model_id: z.string().min(1, "Model is required field."),
  skill: z.enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "MULTIMODAL"]).default("TEXT"),
  project_id: z.string().optional().nullable(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
