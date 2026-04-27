import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations/project";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("archived") === "true";

  const projects = await prisma.project.findMany({
    where: {
      userId: session.user.id,
      ...(includeArchived ? {} : { is_archived: false }),
    },
    orderBy: [{ is_pinned: "desc" }, { updated_at: "desc" }],
    include: {
      _count: { select: { conversations: true } },
      conversations: {
        where: { is_archived: false },
        orderBy: { last_message_at: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          skill: true,
          is_starred: true,
          is_pinned: true,
          last_message_at: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: projects });
}
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validasi gagal", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
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
    include: { _count: { select: { conversations: true } } },
  });

  return NextResponse.json({ success: true, data: project }, { status: 201 });
}
