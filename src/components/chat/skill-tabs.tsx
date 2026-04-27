"use client";

import { MessageSquare, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/model-store";

const SKILL_TABS = [
  { skill: "text" as AISkill, label: "Text", icon: MessageSquare },
  { skill: "image" as AISkill, label: "Image", icon: ImageIcon },
  { skill: "video" as AISkill, label: "Video", icon: Video },
];

export function SkillTabs() {
  const { activeSkill, autoSelectModel } = useModelStore();

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-white/4 border border-white/6 p-0.5">
      {SKILL_TABS.map(({ skill, label, icon: Icon }) => (
        <button
          key={skill}
          onClick={() => autoSelectModel(skill)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            activeSkill === skill
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
