import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserProfileAction } from "@/actions/account";
import { ProfileSection } from "@/components/account/profile-section";
import { SecuritySection } from "@/components/account/security-section";
import { ApiKeysSection } from "@/components/account/api-keys-section";
import { PuterConnectCard } from "@/components/puter/puter-connect-button";
import { User } from "lucide-react";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const profileResult = await getUserProfileAction();
  if (!profileResult.success || !profileResult.data) {
    redirect("/chat");
  }

  const user = profileResult.data;

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

        {/* Profile */}
        <ProfileSection user={user as any} />

        {/* Puter Connection (selalu tampil, baik auto mode maupun static mode) */}
        <PuterConnectCard />

        {/* Security */}
        <SecuritySection hasPassword={user.has_password} />

        {/* API Keys */}
        <ApiKeysSection apiKeys={(user.api_keys ?? []) as any} />
      </div>
    </div>
  );
}
