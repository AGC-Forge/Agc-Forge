"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getSidebarDataAction(): Promise<
  ActionResult<{
    conversations: Conversation[];
    projects: Project[];
  }>
> {
  try {
    const session = await requireAuth();

    const [conversations, projects] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId: session.user.id },
        orderBy: [
          { is_pinned: "desc" },
          { last_message_at: "desc" },
          { created_at: "desc" },
        ],
        select: {
          id: true,
          title: true,
          provider: true,
          model_id: true,
          skill: true,
          is_starred: true,
          is_pinned: true,
          is_archived: true,
          last_message_at: true,
          project_id: true,
          created_at: true,
          updated_at: true,
          project: {
            select: { id: true, name: true, emoji: true, color: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      prisma.project.findMany({
        where: { userId: session.user.id, is_archived: false },
        orderBy: [{ is_pinned: "desc" }, { updated_at: "desc" }],
        include: {
          _count: { select: { conversations: true } },
          conversations: {
            where: { is_archived: false },
            orderBy: { last_message_at: "desc" },
            take: 10,
            select: {
              id: true,
              title: true,
              skill: true,
              is_starred: true,
              is_pinned: true,
              is_archived: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        conversations: conversations as unknown as Conversation[],
        projects: projects as unknown as Project[],
      },
    };
  } catch (err: any) {
    console.error("[getSidebarDataAction]", err);
    return { success: false, error: err.message ?? "Failed to fetch sidebar data." };
  }
}
export async function autoGenerateConversationTitle(
  conversationId: string,
  firstMessage: string
): Promise<void> {
  try {
    // Buat judul dari 5-8 kata pertama pesan
    const words = firstMessage.trim().split(/\s+/).slice(0, 8);
    let title = words.join(" ");
    if (title.length > 80) title = title.slice(0, 77) + "...";
    if (!title) title = "New Conversation";

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });

    revalidatePath("/chat");
  } catch (err) {
    console.error("[autoGenerateTitle]", err);
  }
}
export async function getConversationAction(
  conversationId: string
): Promise<ActionResult<Conversation & { messages: ChatMessage[] }>> {
  try {
    const session = await requireAuth();

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        project: {
          select: { id: true, name: true, emoji: true, color: true, system_prompt: true },
        },
        messages: {
          orderBy: { created_at: "asc" },
          include: {
            media: true,
            gen_jobs: { orderBy: { created_at: "desc" }, take: 5 },
          },
        },
        gen_jobs: {
          where: { status: { in: ["PENDING", "PROCESSING"] } },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found." };
    }

    return {
      success: true,
      data: conversation as unknown as Conversation & { messages: ChatMessage[] },
    };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to fetch conversation." };
  }
}
export async function bulkArchiveConversationsAction(
  ids: string[]
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    await prisma.conversation.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { is_archived: true, is_pinned: false },
    });

    revalidatePath("/chat");
    return { success: true, message: `${ids.length} conversation archived.` };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to archive conversations." };
  }
}
export async function bulkDeleteConversationsAction(
  ids: string[]
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    await prisma.conversation.deleteMany({
      where: { id: { in: ids }, userId: session.user.id },
    });

    revalidatePath("/chat");
    return { success: true, message: `${ids.length} conversation deleted.` };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to delete conversations." };
  }
}
