"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validations/project";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function createProjectAction(
  data: CreateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const session = await requireAuth();

    const parsed = createProjectSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, description, emoji, color, system_prompt } = parsed.data;

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        emoji: emoji || "📁",
        color: color || "#6366f1",
        system_prompt: system_prompt || null,
      },
    });

    revalidatePath("/chat");
    return { success: true, data: project as unknown as Project };
  } catch (err: any) {
    console.error("[createProjectAction]", err);
    return { success: false, error: err.message ?? "Failed to create project." };
  }
}

export async function updateProjectAction(
  projectId: string,
  data: UpdateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const session = await requireAuth();

    const parsed = updateProjectSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Verifikasi ownership
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Project not found." };
    }

    const { name, description, emoji, color, system_prompt, is_pinned, is_archived } =
      parsed.data;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(emoji !== undefined && { emoji: emoji || "📁" }),
        ...(color !== undefined && { color: color || "#6366f1" }),
        ...(system_prompt !== undefined && { system_prompt: system_prompt || null }),
        ...(is_pinned !== undefined && { is_pinned }),
        ...(is_archived !== undefined && { is_archived }),
      },
    });

    revalidatePath("/chat");
    return { success: true, data: project as unknown as Project };
  } catch (err: any) {
    console.error("[updateProjectAction]", err);
    return { success: false, error: err.message ?? "Failed to update project." };
  }
}
export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    // Set null project_id untuk semua conversation di project ini
    // (conversations tidak dihapus, hanya dikeluarkan dari project)
    await prisma.conversation.updateMany({
      where: { project_id: projectId },
      data: { project_id: null },
    });

    await prisma.project.delete({ where: { id: projectId } });

    revalidatePath("/chat");
    return { success: true, message: "Project deleted. Conversations moved to Recent." };
  } catch (err: any) {
    console.error("[deleteProjectAction]", err);
    return { success: false, error: err.message ?? "Failed to delete project." };
  }
}
export async function toggleProjectPinAction(
  projectId: string,
  pin: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) return { success: false, error: "Project not found." };

    await prisma.project.update({
      where: { id: projectId },
      data: { is_pinned: pin },
    });

    revalidatePath("/chat");
    return { success: true, message: pin ? "Project pinned." : "Project unpin." };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to toggle pin." };
  }
}
export async function toggleProjectArchiveAction(
  projectId: string,
  archive: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) return { success: false, error: "Project not found." };

    await prisma.project.update({
      where: { id: projectId },
      data: { is_archived: archive, ...(archive && { is_pinned: false }) },
    });

    revalidatePath("/chat");
    return {
      success: true,
      message: archive ? "Project archived." : "Project restored.",
    };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to toggle archive." };
  }
}
export async function getUserProjectsAction(): Promise<
  ActionResult<Project[]>
> {
  try {
    const session = await requireAuth();

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id, is_archived: false },
      orderBy: [{ is_pinned: "desc" }, { updated_at: "desc" }],
      include: {
        _count: { select: { conversations: true } },
      },
    });

    return { success: true, data: projects as unknown as Project[] };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to fetch projects." };
  }
}
