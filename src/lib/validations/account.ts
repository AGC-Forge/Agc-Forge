import * as z from "zod"

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters.")
    .regex(/^[a-zA-Z0-9\s'\-\.]+$/, "Invalid name.")
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-]{7,20}$/, "Invalid phone number.")
    .optional()
    .or(z.literal("")),
  avatar: z.string().url("Invalid avatar URL.").optional().or(z.literal("")),
});
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required."),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be at most 72 characters.")
      .regex(/[A-Z]/, "Must contain uppercase letter.")
      .regex(/[0-9]/, "Must contain number."),
    confirm_password: z.string().min(1, "Confirm password is required."),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Password do not match.",
    path: ["confirm_password"],
  });

export const saveApiKeySchema = z.object({
  provider: z.string().min(1, "Provider is required."),
  api_key: z
    .string()
    .min(8, "API key must be at least 8 characters.")
    .max(500, "API key is too long."),
  label: z.string().max(100, "Label is too long.").optional().or(z.literal("")),
});

export const appSettingsSchema = z.object({
  site_name: z.string().min(1).max(100),
  site_description: z.string().max(500).optional().or(z.literal("")),
  is_maintenance: z.boolean(),
  enable_register: z.boolean(),
  enable_github_provider: z.boolean(),
  enable_google_provider: z.boolean(),
  default_provider: z.string().optional(),
  default_model_id: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SaveApiKeyInput = z.infer<typeof saveApiKeySchema>;
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;
