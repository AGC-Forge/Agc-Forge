import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type {
  ConversationCreateInput,
  MessageCreateInput,
} from "@/prisma/models";
import type { Media as MediaBase, GenJob as GenJobBase } from "@/prisma/client";
import { ConversationView } from "@/components/chat/conversation-view";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ init?: string }>;
}

type SerializedMessage = Omit<
  MessageCreateInput,
  "created_at" | "updated_at"
> & {
  created_at: string | null;
  updated_at: string | null;
  media: Array<
    Omit<MediaBase, "created_at" | "updated_at"> & {
      created_at: string | null;
      updated_at: string | null;
    }
  >;
  gen_jobs: Array<
    Omit<
      GenJobBase,
      "created_at" | "updated_at" | "started_at" | "completed_at"
    > & {
      created_at: string | null;
      updated_at: string | null;
      started_at: string | null;
      completed_at: string | null;
    }
  >;
};

type SerializedConversation = Omit<
  ConversationCreateInput,
  "created_at" | "updated_at" | "last_message_at" | "messages"
> & {
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  messages: SerializedMessage[];
};

function serializeConversation(conversation: any): SerializedConversation {
  const toISOString = (
    date: Date | string | null | undefined,
  ): string | null => {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === "string") return date;
    return null;
  };

  return {
    ...conversation,
    created_at: toISOString(conversation.created_at),
    updated_at: toISOString(conversation.updated_at),
    last_message_at: toISOString(conversation.last_message_at),
    messages: conversation.messages.map(
      (message: any): SerializedMessage => ({
        ...message,
        created_at: toISOString(message.created_at),
        updated_at: toISOString(message.updated_at),
        media: (message.media || []).map((media: any) => ({
          ...media,
          created_at: toISOString(media.created_at),
          updated_at: toISOString(media.updated_at),
        })),
        gen_jobs: (message.gen_jobs || []).map((job: any) => ({
          ...job,
          created_at: toISOString(job.created_at),
          updated_at: toISOString(job.updated_at),
          started_at: toISOString(job.started_at),
          completed_at: toISOString(job.completed_at),
        })),
      }),
    ),
  };
}

export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const { init } = await searchParams;

  // Ambil conversation + messages dari DB
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: {
        orderBy: { created_at: "asc" },
        include: {
          media: true,
          gen_jobs: true,
        },
      },
      project: { select: { id: true, name: true, emoji: true } },
    },
  });

  if (!conversation) notFound();

  // Serialize (prisma returns Date objects)
  const serialized: SerializedConversation =
    serializeConversation(conversation);

  const userInitials = (session.user.name ?? session.user.email ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <ConversationView
      conversation={serialized as any}
      userInitials={userInitials}
      initialMessage={init}
    />
  );
}

export async function generateMetadata({ params }: ConversationPageProps) {
  const { id } = await params;
  const conv = await prisma.conversation.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: conv?.title ?? "Chat" };
}
