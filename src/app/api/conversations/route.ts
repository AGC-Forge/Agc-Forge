import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/conversations — ambil semua conversations user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const includeArchived = searchParams.get("archived") === "true";
  const search = searchParams.get("q");

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: session.user.id,
      ...(projectId ? { project_id: projectId } : {}),
      ...(includeArchived ? {} : { is_archived: false }),
      ...(search
        ? { title: { contains: search, mode: "insensitive" } }
        : {}),
    },
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
      project: { select: { id: true, name: true, emoji: true, color: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ success: true, data: conversations });
}

// POST /api/conversations — buat conversation baru
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    title: string;
    provider: string;
    model_id: string;
    skill: string;
    project_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, provider, model_id, skill, project_id } = body;

  if (!title || !provider || !model_id || !skill) {
    return NextResponse.json(
      { error: "title, provider, model_id, skill wajib diisi" },
      { status: 400 }
    );
  }

  // Verifikasi project jika diberikan
  if (project_id) {
    const project = await prisma.project.findFirst({
      where: { id: project_id, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title: title.slice(0, 200),
      provider,
      model_id,
      skill: skill.toUpperCase() as any,
      project_id: project_id ?? null,
    },
  });

  return NextResponse.json({ success: true, data: conversation }, { status: 201 });
}
