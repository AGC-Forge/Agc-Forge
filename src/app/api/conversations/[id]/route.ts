import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteManyFromMinio } from "@/lib/minio";

type Params = { params: Promise<{ id: string }> };

// GET /api/conversations/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      project: { select: { id: true, name: true, emoji: true, color: true, system_prompt: true } },
      messages: {
        orderBy: { created_at: "asc" },
        include: {
          media: true,
          gen_jobs: { orderBy: { created_at: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: conversation });
}

// PATCH /api/conversations/[id] — update (sidebar actions)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: {
    action: ConversationSidebarAction;
    title?: string;
    project_id?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verifikasi ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation tidak ditemukan" }, { status: 404 });
  }

  let updateData: Record<string, any> = {};

  switch (body.action) {
    case "rename":
      if (!body.title?.trim()) {
        return NextResponse.json({ error: "Title wajib diisi" }, { status: 400 });
      }
      updateData = { title: body.title.trim().slice(0, 200) };
      break;

    case "star":
      updateData = { is_starred: true };
      break;

    case "unstar":
      updateData = { is_starred: false };
      break;

    case "pin":
      updateData = { is_pinned: true };
      break;

    case "unpin":
      updateData = { is_pinned: false };
      break;

    case "archive":
      updateData = { is_archived: true, is_pinned: false };
      break;

    case "unarchive":
      updateData = { is_archived: false };
      break;

    case "move_to_project":
      if (!body.project_id) {
        return NextResponse.json({ error: "project_id wajib diisi" }, { status: 400 });
      }
      // Verifikasi project milik user
      const project = await prisma.project.findFirst({
        where: { id: body.project_id, userId: session.user.id },
      });
      if (!project) {
        return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
      }
      updateData = { project_id: body.project_id };
      break;

    case "remove_from_project":
      updateData = { project_id: null };
      break;

    default:
      return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  }

  const updated = await prisma.conversation.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, data: updated });
}

// DELETE /api/conversations/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verifikasi ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: {
        include: { media: { select: { object_key: true, bucket: true } } },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation tidak ditemukan" }, { status: 404 });
  }

  // Kumpulkan semua object keys MinIO untuk dihapus
  const objectKeys = conversation.messages
    .flatMap((m) => m.media)
    .filter((m) => m.bucket !== "puter-direct") // skip URL langsung
    .map((m) => m.object_key);

  // Hapus dari MinIO
  if (objectKeys.length > 0) {
    await deleteManyFromMinio(objectKeys).catch((err) => {
      console.error("[Delete Conversation] MinIO cleanup error:", err);
    });
  }

  // Hapus dari DB (cascade ke messages, media, gen_jobs)
  await prisma.conversation.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "Conversation dihapus" });
}
