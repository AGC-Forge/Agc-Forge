import type { Metadata } from "next";
import { Settings } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
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
        <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-6">
          <p className="text-sm text-zinc-500">
            Settings detail will be available in Phase 7.
          </p>
        </div>
      </div>
    </div>
  );
}
