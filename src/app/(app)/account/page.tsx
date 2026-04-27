import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { User, Key } from "lucide-react";

export const metadata: Metadata = { title: "Akun" };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            Account & API Keys
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your account and API keys
          </p>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Profile</h2>
          <div className="grid gap-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-zinc-500">Name</span>
              <span className="text-sm text-zinc-200">
                {session.user.name ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-zinc-500">Email</span>
              <span className="text-sm text-zinc-200">
                {session.user.email}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-500">Role</span>
              <span className="text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 rounded-full px-2 py-0.5">
                {(session.user as any).role ?? "user"}
              </span>
            </div>
          </div>
        </div>

        {/* API Keys card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-400" />
            API Keys
          </h2>
          <p className="text-sm text-zinc-500">
            API key management will be available Soon
          </p>
        </div>
      </div>
    </div>
  );
}
