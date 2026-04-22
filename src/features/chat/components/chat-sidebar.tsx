"use client";

import Link from "next/link";
import {
  PlusCircle,
  MessageSquare,
  History,
  LogOut,
  TrendingUp,
  Trash2,
  Search,
  X,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "@/types/chat";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { SettingsDialog } from "./settings-dialog";
import { ProfileDialog } from "@/components/profile-dialog";
import { useState, useEffect } from "react";
import { createChat, renameChat } from "@/app/(dashboard)/chat/actions";
import { Copyright } from "@/components/copyright";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSidebarProps {
  chats: Chat[];
  onClose?: () => void;
}

export function ChatSidebar({ chats, onClose }: ChatSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { tutorSettings, setTutorSettings, userProfile, setUserProfile } = useAppStore();
  // Use local state only if needed, or rely on store
  // const [profile, setProfile] = useState<any>(null) -> Removing local state effectively

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"title" | "content">("title");
  const [messageResults, setMessageResults] = useState<
    Array<{ chatId: string; chatTitle: string; snippet: string; role: string }>
  >([]);
  const [searchingMessages, setSearchingMessages] = useState(false);

  const filteredChats = searchQuery.trim()
    ? chats.filter((c) => (c.title ?? "").toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : chats;

  // Debounced content search
  useEffect(() => {
    if (searchMode !== "content") {
      setMessageResults([]);
      return;
    }
    const q = searchQuery.trim();
    if (q.length < 2) {
      setMessageResults([]);
      return;
    }
    setSearchingMessages(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch("/api/chat/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessageResults(data.results ?? []);
        } else {
          setMessageResults([]);
        }
      } catch {
        setMessageResults([]);
      } finally {
        setSearchingMessages(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, searchMode]);

  const handleRename = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingId(null);
      return;
    }
    await renameChat(chatId, newTitle.trim());
    setEditingId(null);
    router.refresh();
  };

  // Hydrate settings and profile on mount ONLY if missing
  useEffect(() => {
    // Settings Cache Check
    if (!tutorSettings.modes || tutorSettings.modes.length === 0) {
      fetch("/api/me/settings")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setTutorSettings(data);
        })
        .catch((err) => console.error("Failed to load settings", err));
    }

    // Profile Cache Check
    if (!userProfile) {
      fetch("/api/me/profile")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setUserProfile(data);
        })
        .catch((err) => console.error("Failed to load profile", err));
    }
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteChat = async () => {
    if (!deleteId) return;

    await fetch(`/api/chat/${deleteId}`, { method: "DELETE" });

    // If we are on this chat, go back to main screen
    if (pathname === `/chat/${deleteId}`) {
      router.push("/chat");
    }

    setDeleteId(null);
    router.refresh();
  };

  return (
    <div className="flex h-full w-72 flex-col border-r border-law-accent/100 bg-[#020617] text-gem-offwhite">
      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border border-white/10 bg-gem-onyx text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Borrar chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción eliminará este chat y todo su historial de mensajes. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteChat}
              className="border-0 bg-red-500 text-white hover:bg-red-600"
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header / Brand Area */}
      <div className="border-b border-law-accent/10 px-4 py-2 pt-6">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="font-serif text-xl italic text-law-gold">LexTutor Agent</span>
          <SettingsDialog />
        </div>

        {/* Profile Card */}
        <div className="group relative mb-6 flex items-center gap-3 rounded-lg border border-white/5 bg-gem-mist/30 p-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-law-gold/30 bg-law-gold/20 text-law-gold">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-serif text-lg font-bold">⚖️</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="max-w-[120px] truncate text-sm font-bold text-white">
              {userProfile?.full_name || "Invitado Elite"}
            </p>
          </div>
          <div className="absolute right-2 opacity-100 transition-opacity hover:opacity-100">
            <ProfileDialog />
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={async () => {
              // Redirect will happen server-side after chat creation + welcome msg
              // Sidebar will close naturally on navigation
              await createChat();
            }}
            className="mb-2 h-10 w-full justify-start gap-3 border border-law-gold/30 bg-law-gold/10 text-xs font-bold uppercase tracking-wide text-law-gold transition-all duration-300 hover:bg-law-gold hover:text-gem-onyx"
          >
            <PlusCircle size={16} />
            Nuevo Chat
          </Button>

          {/* ESTADÍSTICA */}
          <div className="space-y-1">
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
              Estadística
            </p>
            <Link href="/progress" prefetch={true}>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-full justify-start gap-3 text-xs font-medium tracking-wide transition-all duration-300",
                  pathname === "/progress"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <TrendingUp size={16} />
                Mi Progreso
              </Button>
            </Link>

            <Link href="/leaderboard" prefetch={true}>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-full justify-start gap-3 text-xs font-medium tracking-wide transition-all duration-300",
                  pathname === "/leaderboard"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Trophy size={16} />
                Ranking
              </Button>
            </Link>

            <Link href="/exams" prefetch={true}>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-full justify-start gap-3 text-xs font-medium tracking-wide transition-all duration-300",
                  pathname === "/exams"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <History size={16} />
                Evaluaciones
              </Button>
            </Link>
          </div>

          {/* PRÁCTICA */}
          <div className="space-y-1">
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
              Práctica
            </p>
            <Link href="/quiz" prefetch={true}>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-full justify-start gap-3 text-xs font-medium tracking-wide transition-all duration-300",
                  pathname === "/quiz"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                Test Rápido
              </Button>
            </Link>
            <Link href="/exam" prefetch={true}>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-full justify-start gap-3 text-xs font-medium tracking-wide transition-all duration-300",
                  pathname === "/exam"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="h-1 w-1 rounded-full bg-purple-500"></span>
                Examen Abierto
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-8">
        <div className="sticky top-0 z-10 space-y-2 bg-[#020617] px-6 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Historial</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder={searchMode === "title" ? "Buscar chats…" : "Buscar en mensajes…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-white/5 bg-white/5 py-1.5 pl-8 pr-7 text-xs text-gem-offwhite placeholder:text-gray-600 focus:border-law-gold/40 focus:bg-white/10 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-600 hover:bg-white/10 hover:text-gem-offwhite"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex gap-1 text-[10px]">
            <button
              onClick={() => setSearchMode("title")}
              className={cn(
                "rounded px-2 py-0.5 transition",
                searchMode === "title"
                  ? "bg-law-gold/20 text-law-gold"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              Por título
            </button>
            <button
              onClick={() => setSearchMode("content")}
              className={cn(
                "rounded px-2 py-0.5 transition",
                searchMode === "content"
                  ? "bg-law-gold/20 text-law-gold"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              En mensajes
            </button>
          </div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto px-2">
          {searchMode === "content" && searchQuery.trim().length >= 2 && (
            <div className="py-2">
              {searchingMessages && (
                <p className="px-4 py-3 text-center text-xs italic text-gray-600">Buscando…</p>
              )}
              {!searchingMessages && messageResults.length === 0 && (
                <p className="px-4 py-6 text-center text-xs italic text-gray-600">
                  Sin coincidencias en mensajes
                </p>
              )}
              {!searchingMessages &&
                messageResults.map((r, i) => (
                  <Link
                    key={i}
                    href={`/chat/${r.chatId}`}
                    onClick={() => onClose?.()}
                    className="mb-1 block rounded-lg border border-white/5 bg-white/5 px-3 py-2 transition hover:border-law-gold/30 hover:bg-law-gold/5"
                  >
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-law-gold/70">
                      {r.chatTitle}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{r.snippet}</p>
                  </Link>
                ))}
            </div>
          )}
          {searchMode === "title" && filteredChats.length === 0 && searchQuery && (
            <p className="px-4 py-6 text-center text-xs italic text-gray-600">
              Sin resultados para &ldquo;{searchQuery}&rdquo;
            </p>
          )}
          {searchMode === "title" &&
            filteredChats.map((chat) => (
              <div key={chat.id} className="group relative">
                {editingId === chat.id ? (
                  <div
                    className={cn(
                      "mb-1 flex items-center gap-3 rounded-xl px-4 py-3 pr-2 text-xs transition-all duration-200",
                      "border border-law-gold/30 bg-white/5"
                    )}
                  >
                    <MessageSquare size={16} className="flex-shrink-0 text-law-gold" />
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          await handleRename(chat.id, editTitle);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      onBlur={() => handleRename(chat.id, editTitle)}
                      className="w-full border-none bg-transparent text-white outline-none placeholder:text-gray-600"
                    />
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/chat/${chat.id}`}
                      prefetch={true}
                      onClick={() => onClose?.()}
                      className={cn(
                        "mb-1 flex items-center gap-3 rounded-xl px-4 py-3 pr-16 text-xs transition-all duration-200",
                        pathname === `/chat/${chat.id}`
                          ? "border border-white/5 bg-law-accent/20 text-white shadow-lg shadow-black/20"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <MessageSquare
                        size={16}
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          pathname === `/chat/${chat.id}`
                            ? "text-law-gold"
                            : "text-gray-600 group-hover:text-gray-400"
                        )}
                      />
                      <span className="truncate font-medium">{chat.title}</span>
                    </Link>
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingId(chat.id);
                          setEditTitle(chat.title || "");
                        }}
                        className="p-1.5 text-gray-600 transition-colors hover:text-law-gold"
                      >
                        {/* Edit Icon (Pencil) */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(chat.id);
                        }}
                        className="p-1.5 text-gray-600 transition-colors hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#010409]">
        <Copyright className="py-2 text-[9px]" />
      </div>
    </div>
  );
}
