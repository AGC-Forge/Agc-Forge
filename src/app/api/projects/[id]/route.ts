import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validations/project";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      conversations: {
        where: { is_archived: false },
        orderBy: [{ is_pinned: "desc" }, { last_message_at: "desc" }],
        select: {
          id: true,
          title: true,
          skill: true,
          model_id: true,
          provider: true,
          is_starred: true,
          is_pinned: true,
          is_archived: true,
          last_message_at: true,
          _count: { select: { messages: true } },
        },
      },
      _count: { select: { conversations: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: project });
}
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Verifikasi ownership
  const existing = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { name, description, emoji, color, system_prompt, is_pinned, is_archived } =
    parsed.data;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(emoji !== undefined && { emoji: emoji || "📁" }),
      ...(color !== undefined && { color: color || "#6366f1" }),
      ...(system_prompt !== undefined && { system_prompt: system_prompt || null }),
      ...(is_pinned !== undefined && { is_pinned }),
      ...(is_archived !== undefined && {
        is_archived,
        ...(is_archived && { is_pinned: false }),
      }),
    },
  });

  return NextResponse.json({ success: true, data: project });
}
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const deleteConversations = searchParams.get("delete_conversations") === "true";

  if (deleteConversations) {
    // Hapus semua conversations dalam project
    await prisma.conversation.deleteMany({ where: { project_id: id } });
  } else {
    // Pindahkan conversations ke standalone (null project_id)
    await prisma.conversation.updateMany({
      where: { project_id: id },
      data: { project_id: null },
    });
  }

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    message: deleteConversations
      ? "Project and all conversations deleted."
      : "Project deleted. Conversations moved to Recent.",
  });
}
