import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSettingsAction } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { Settings } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const settingsResult = await getSettingsAction();
  const currentSettings = settingsResult.data ?? {};

  const roleLevel = (session.user as any).role_level ?? 0;
  const isAdmin = roleLevel >= 100;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-400" />
            Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure application preferences
          </p>
        </div>
        <SettingsForm currentSettings={currentSettings} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
