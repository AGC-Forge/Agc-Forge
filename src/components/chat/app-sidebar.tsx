"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  BrainCircuit,
  Plus,
  Search,
  Star,
  StarOff,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  FolderOpen,
  FolderPlus,
  MessageSquare,
  MoreHorizontal,
  ChevronRight,
  LogOut,
  Settings,
  User,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { signOut } from "next-auth/react";

// ── Types (data diambil dari server via props / SWR) ─────────────────────────

interface ConversationItem {
  id: string;
  title: string;
  is_starred: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  skill: string;
  model_id: string;
  last_message_at?: Date | null;
  project_id?: string | null;
}

interface ProjectItem {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  is_pinned: boolean;
  conversations?: ConversationItem[];
}

interface AppSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  projects?: ProjectItem[];
  conversations?: ConversationItem[];
}

// ── Skill badge color ─────────────────────────────────────────────────────────

function SkillDot({ skill }: { skill: string }) {
  const color =
    skill === "IMAGE"
      ? "bg-violet-500"
      : skill === "VIDEO"
        ? "bg-cyan-500"
        : "bg-indigo-500";
  return <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", color)} />;
}

// ── Rename Dialog ─────────────────────────────────────────────────────────────

function RenameDialog({
  open,
  current,
  onClose,
  onConfirm,
}: {
  open: boolean;
  current: string;
  onClose: () => void;
  onConfirm: (title: string) => void;
}) {
  const [value, setValue] = useState(current);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-[#111118] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Rename Conversation</DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onConfirm(value.trim());
          }}
          className="border-white/10 bg-white/5 text-white"
          autoFocus
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">
            Cancel
          </Button>
          <Button
            onClick={() => value.trim() && onConfirm(value.trim())}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Conversation Item with context menu ──────────────────────────────────────

function ConversationRow({
  conv,
  isActive,
  onAction,
}: {
  conv: ConversationItem;
  isActive: boolean;
  onAction: (action: ConversationSidebarAction, conv: ConversationItem) => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "group h-8 gap-2 rounded-lg pr-8 text-zinc-400 hover:text-white hover:bg-white/5",
          "data-[active=true]:bg-white/8 data-[active=true]:text-white",
          conv.is_starred && "text-zinc-300",
          conv.is_archived && "opacity-50",
        )}
      >
        <Link href={`/chat/${conv.id}`}>
          <SkillDot skill={conv.skill} />
          <span className="truncate text-sm flex-1">{conv.title}</span>
          {conv.is_starred && (
            <Star className="h-3 w-3 text-amber-400 shrink-0 fill-amber-400" />
          )}
          {conv.is_pinned && (
            <Pin className="h-3 w-3 text-indigo-400 shrink-0" />
          )}
        </Link>
      </SidebarMenuButton>

      {/* Context menu (⋯ button) */}
      <SidebarMenuAction showOnHover asChild>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
              aria-label="More options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="w-44 bg-[#111118] border-white/10"
          >
            {/* Rename */}
            <DropdownMenuItem
              className="gap-2 text-zinc-300 hover:text-white focus:text-white"
              onClick={() => onAction("rename", conv)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>

            {/* Star / Unstar */}
            <DropdownMenuItem
              className="gap-2 text-zinc-300 hover:text-white focus:text-white"
              onClick={() =>
                onAction(conv.is_starred ? "unstar" : "star", conv)
              }
            >
              {conv.is_starred ? (
                <>
                  <StarOff className="h-3.5 w-3.5" /> Unstar
                </>
              ) : (
                <>
                  <Star className="h-3.5 w-3.5" /> Star
                </>
              )}
            </DropdownMenuItem>

            {/* Pin / Unpin */}
            <DropdownMenuItem
              className="gap-2 text-zinc-300 hover:text-white focus:text-white"
              onClick={() => onAction(conv.is_pinned ? "unpin" : "pin", conv)}
            >
              {conv.is_pinned ? (
                <>
                  <PinOff className="h-3.5 w-3.5" /> Unpin
                </>
              ) : (
                <>
                  <Pin className="h-3.5 w-3.5" /> Pin
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Archive / Unarchive */}
            <DropdownMenuItem
              className="gap-2 text-zinc-300 hover:text-white focus:text-white"
              onClick={() =>
                onAction(conv.is_archived ? "unarchive" : "archive", conv)
              }
            >
              {conv.is_archived ? (
                <>
                  <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" /> Archive
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Delete */}
            <DropdownMenuItem
              className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
              onClick={() => onAction("delete", conv)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}

// ── Main AppSidebar ──────────────────────────────────────────────────────────

export function AppSidebar({
  user,
  projects = [],
  conversations = [],
}: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, showArchived } = useUIStore();
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [renameTarget, setRenameTarget] = useState<ConversationItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ConversationItem | null>(
    null,
  );

  // ── Filter conversations ────────────────────────────────────────────────────
  const filteredConvs = conversations.filter((c) => {
    if (!showArchived && c.is_archived) return false;
    if (searchQuery) {
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const pinnedConvs = filteredConvs.filter((c) => c.is_pinned && !c.project_id);
  const starredConvs = filteredConvs.filter(
    (c) => c.is_starred && !c.is_pinned && !c.project_id,
  );
  const recentConvs = filteredConvs.filter(
    (c) => !c.is_pinned && !c.is_starred && !c.project_id,
  );

  // ── Handle actions ──────────────────────────────────────────────────────────
  const handleAction = async (
    action: ConversationSidebarAction,
    conv: ConversationItem,
  ) => {
    switch (action) {
      case "rename":
        setRenameTarget(conv);
        break;
      case "delete":
        setDeleteTarget(conv);
        break;
      default:
        startTransition(async () => {
          try {
            const res = await fetch(`/api/conversations/${conv.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            });
            if (!res.ok) throw new Error();
            toast.success(
              action === "star"
                ? "Added to star"
                : action === "unstar"
                  ? "Unstar"
                  : action === "pin"
                    ? "Pin"
                    : action === "unpin"
                      ? "Unpin"
                      : action === "archive"
                        ? "Archive"
                        : action === "unarchive"
                          ? "Restore"
                          : "Success",
            );
            router.refresh();
          } catch {
            toast.error("Failed. Try again later.");
          }
        });
    }
  };

  const handleRename = async (newTitle: string) => {
    if (!renameTarget) return;
    try {
      const res = await fetch(`/api/conversations/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", title: newTitle }),
      });
      if (!res.ok) throw new Error();
      toast.success("Renamed");
      setRenameTarget(null);
      router.refresh();
    } catch {
      toast.error("Failed. Try again later.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/conversations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Conversation deleted");
      setDeleteTarget(null);
      // Redirect jika sedang di conversation yang dihapus
      if (pathname === `/chat/${deleteTarget.id}`) {
        router.push("/chat");
      }
      router.refresh();
    } catch {
      toast.error("Failed to delete. Try again later.");
    }
  };

  const activeConvId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  // ── User initials ───────────────────────────────────────────────────────────
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <Sidebar
        className="border-r border-white/6 bg-[#0c0c12]"
        collapsible="offcanvas"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <SidebarHeader className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <Link href="/chat" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Forge AI</span>
            </Link>
            <div className="flex items-center gap-1">
              <SidebarTrigger className="h-7 w-7 text-zinc-500 hover:text-white" />
              <Link href="/chat">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/8"
                  title="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <SidebarInput
              placeholder="Cari conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-white/5 border-white/8 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-1 gap-0">
          {/* ── New Chat button ─────────────────────────────────────────────── */}
          <div className="px-1 pb-2">
            <Link href="/chat">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-9 border-white/8 bg-white/3 text-zinc-400 hover:text-white hover:bg-white/8 hover:border-white/12 text-sm"
              >
                <Plus className="h-4 w-4" />
                New chat
              </Button>
            </Link>
          </div>

          {/* ── Projects ─────────────────────────────────────────────────────── */}
          {projects.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-medium text-zinc-600 px-2 py-1">
                Projects
              </SidebarGroupLabel>
              <SidebarGroupAction asChild title="New project">
                <Link href="/chat?new=project">
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        asChild
                        className="gap-2 h-8 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg"
                      >
                        <Link href={`/chat?project=${project.id}`}>
                          <span className="text-base leading-none">
                            {project.emoji ?? "📁"}
                          </span>
                          <span className="truncate text-sm flex-1">
                            {project.name}
                          </span>
                          {project.conversations &&
                            project.conversations.length > 0 && (
                              <span className="text-[10px] text-zinc-600 tabular-nums">
                                {project.conversations.length}
                              </span>
                            )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* ── Pinned conversations ──────────────────────────────────────────── */}
          {pinnedConvs.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-medium text-zinc-600 px-2 py-1">
                Pinned
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pinnedConvs.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conv={conv}
                      isActive={activeConvId === conv.id}
                      onAction={handleAction}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* ── Starred conversations ─────────────────────────────────────────── */}
          {starredConvs.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-medium text-zinc-600 px-2 py-1">
                Starred
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {starredConvs.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conv={conv}
                      isActive={activeConvId === conv.id}
                      onAction={handleAction}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* ── Recent conversations ──────────────────────────────────────────── */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-medium text-zinc-600 px-2 py-1">
              {searchQuery ? "Search results" : "Recent"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentConvs.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <MessageSquare className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-zinc-600">
                      {searchQuery
                        ? "No results found"
                        : "No conversation.\nStart chat!"}
                    </p>
                  </div>
                ) : (
                  recentConvs.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conv={conv}
                      isActive={activeConvId === conv.id}
                      onAction={handleAction}
                    />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer: User menu ─────────────────────────────────────────────── */}
        <SidebarFooter className="border-t border-white/6 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all hover:bg-white/5 group">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? ""}
                  />
                  <AvatarFallback className="bg-indigo-600 text-white text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {user.name ?? "User"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-52 bg-[#111118] border-white/10"
            >
              <DropdownMenuItem asChild className="gap-2 text-zinc-300">
                <Link href="/account">
                  <User className="h-4 w-4" /> Account & API Keys
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 text-zinc-300">
                <Link href="/settings">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ── Rename Dialog ─────────────────────────────────────────────────────── */}
      <RenameDialog
        open={!!renameTarget}
        current={renameTarget?.title ?? ""}
        onClose={() => setRenameTarget(null)}
        onConfirm={handleRename}
      />

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm bg-[#111118] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Delete conversation?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            <span className="text-white font-medium">
              &quot;{deleteTarget?.title}&quot;
            </span>{" "}
            will be permanently deleted. All messages and files related to it
            will also be deleted.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
