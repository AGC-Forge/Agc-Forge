"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModelSelector } from "@/components/chat/model-selector";
import { SkillTabs } from "@/components/chat/skill-tabs";
import { Separator } from "@/components/ui/separator";

export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/6 bg-[#09090b] px-3">
      {/* Sidebar toggle */}
      <SidebarTrigger className="h-7 w-7 text-zinc-500 hover:text-white" />

      <Separator orientation="vertical" className="h-4 bg-white/10" />

      {/* Skill tabs (Text / Image / Video) */}
      <SkillTabs />

      <div className="flex-1" />

      {/* Model selector */}
      <ModelSelector />
    </header>
  );
}
