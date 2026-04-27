import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { AppHeader } from "@/components/chat/app-header";
import { prisma } from "@/lib/prisma";

// Fetch sidebar data server-side (fresh setiap request)
async function getSidebarData(userId: string) {
  const [conversations, projects] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId },
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
      },
    }),
    prisma.project.findMany({
      where: { userId, is_archived: false },
      orderBy: [{ is_pinned: "desc" }, { updated_at: "desc" }],
      include: {
        _count: {
          select: { conversations: { where: { is_archived: false } } },
        },
        conversations: {
          where: { is_archived: false },
          orderBy: [{ is_pinned: "desc" }, { last_message_at: "desc" }],
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

  return { conversations, projects };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { conversations, projects } = await getSidebarData(session.user.id);

  // Serialize dates untuk client components
  const serializedConversations = conversations.map((c) => ({
    ...c,
    last_message_at: c.last_message_at?.toISOString() ?? null,
    created_at: c.created_at.toISOString(),
  }));

  const serializedProjects = projects.map((p) => ({
    ...p,
    created_at: (p as any).created_at?.toISOString?.() ?? "",
    updated_at: (p as any).updated_at?.toISOString?.() ?? "",
  }));

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-[#09090b]">
        <AppSidebar
          user={session.user}
          conversations={serializedConversations as any}
          projects={serializedProjects as any}
        />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
