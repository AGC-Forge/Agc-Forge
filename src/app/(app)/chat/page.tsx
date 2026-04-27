import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewChatView } from "@/components/chat/new-chat-view";

export default async function ChatPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <NewChatView user={session.user} />;
}
