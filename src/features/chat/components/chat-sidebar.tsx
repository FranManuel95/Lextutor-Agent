'use client'

import Link from 'next/link'
import { PlusCircle, MessageSquare, History, LogOut, TrendingUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Chat } from '@/types/chat'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { SettingsDialog } from './settings-dialog'
import { ProfileDialog } from '@/components/profile-dialog'
import { useState, useEffect } from 'react'
import { createChat, renameChat } from '@/app/(dashboard)/chat/actions'
import { Copyright } from '@/components/copyright'

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChatSidebarProps {
    chats: Chat[]
    onClose?: () => void
}

export function ChatSidebar({ chats, onClose }: ChatSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { tutorSettings, setTutorSettings, userProfile, setUserProfile } = useAppStore()
    // Use local state only if needed, or rely on store
    // const [profile, setProfile] = useState<any>(null) -> Removing local state effectively

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")

    const handleRename = async (chatId: string, newTitle: string) => {
        if (!newTitle.trim()) {
            setEditingId(null)
            return
        }
        await renameChat(chatId, newTitle.trim())
        setEditingId(null)
        router.refresh()
    }

    // Hydrate settings and profile on mount ONLY if missing
    useEffect(() => {
        // Settings Cache Check
        if (!tutorSettings.modes || tutorSettings.modes.length === 0) {
            fetch('/api/me/settings')
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setTutorSettings(data)
                })
                .catch(err => console.error('Failed to load settings', err))
        }

        // Profile Cache Check
        if (!userProfile) {
            fetch('/api/me/profile')
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setUserProfile(data)
                })
                .catch(err => console.error('Failed to load profile', err))
        }
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleDeleteChat = async () => {
        if (!deleteId) return

        await fetch(`/api/chat/${deleteId}`, { method: 'DELETE' })

        // If we are on this chat, go back to main screen
        if (pathname === `/chat/${deleteId}`) {
            router.push('/chat')
        }

        setDeleteId(null)
        router.refresh()
    }

    return (
        <div className="flex bg-[#020617] text-gem-offwhite w-72 flex-col h-full border-r border-law-accent/100">
            {/* Delete Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-gem-onyx border border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">¿Borrar chat?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Esta acción eliminará este chat y todo su historial de mensajes. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent text-white border-white/10 hover:bg-white/5 hover:text-white">Cancelar</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteChat}
                            className="bg-red-500 hover:bg-red-600 text-white border-0"
                        >
                            Eliminar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header / Brand Area */}
            <div className="px-4 pt-6 py-2 border-b border-law-accent/10">
                <div className="mb-2 px-2 flex justify-between items-center">
                    <span className="font-serif italic text-xl text-law-gold">
                        LexTutor Agent
                    </span>
                    <SettingsDialog />
                </div>

                {/* Profile Card */}
                <div className="bg-gem-mist/30 p-3 rounded-lg border border-white/5 mb-6 flex items-center gap-3 relative group">
                    <div className="w-10 h-10 rounded-full bg-law-gold/20 flex items-center justify-center text-law-gold overflow-hidden border border-law-gold/30">
                        {userProfile?.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-serif font-bold text-lg">⚖️</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate max-w-[120px]">
                            {userProfile?.full_name || 'Invitado Elite'}
                        </p>

                    </div>
                    <div className="absolute right-2 opacity-100 hover:opacity-100 transition-opacity">
                        <ProfileDialog />
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={async () => {
                            // Redirect will happen server-side after chat creation + welcome msg
                            // Sidebar will close naturally on navigation
                            await createChat()
                        }}
                        className="w-full justify-start gap-3 bg-law-gold/10 border border-law-gold/30 text-law-gold hover:bg-law-gold hover:text-gem-onyx transition-all duration-300 font-bold tracking-wide uppercase text-xs h-10 mb-2"
                    >
                        <PlusCircle size={16} />
                        Nuevo Chat
                    </Button>

                    {/* ESTADÍSTICA */}
                    <div className="space-y-1">
                        <p className="px-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Estadística</p>
                        <Link href="/progress" prefetch={true}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 transition-all duration-300 font-medium tracking-wide text-xs h-8",
                                    pathname === '/progress' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <TrendingUp size={16} />
                                Mi Progreso
                            </Button>
                        </Link>

                        <Link href="/exams" prefetch={true}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 transition-all duration-300 font-medium tracking-wide text-xs h-8",
                                    pathname === '/exams' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <History size={16} />
                                Evaluaciones
                            </Button>
                        </Link>
                    </div>

                    {/* PRÁCTICA */}
                    <div className="space-y-1">
                        <p className="px-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Práctica</p>
                        <Link href="/quiz" prefetch={true}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 transition-all duration-300 font-medium tracking-wide text-xs h-8",
                                    pathname === '/quiz' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                Test Rápido
                            </Button>
                        </Link>
                        <Link href="/exam" prefetch={true}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 transition-all duration-300 font-medium tracking-wide text-xs h-8",
                                    pathname === '/exam' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                                Examen Abierto
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 pb-8">
                <div className="px-6 py-2 bg-[#020617] sticky top-0 z-10">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Historial</p>
                </div>
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    {chats.map((chat) => (
                        <div key={chat.id} className="group relative">
                            {editingId === chat.id ? (
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs mb-1 pr-2",
                                    "bg-white/5 border border-law-gold/30"
                                )}>
                                    <MessageSquare size={16} className="text-law-gold flex-shrink-0" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                await handleRename(chat.id, editTitle)
                                            } else if (e.key === 'Escape') {
                                                setEditingId(null)
                                            }
                                        }}
                                        onBlur={() => handleRename(chat.id, editTitle)}
                                        className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600"
                                    />
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href={`/chat/${chat.id}`}
                                        prefetch={true}
                                        onClick={() => onClose?.()}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs mb-1 pr-16",
                                            pathname === `/chat/${chat.id}`
                                                ? "bg-law-accent/20 text-white shadow-lg shadow-black/20 border border-white/5"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <MessageSquare size={16} className={cn(
                                            "transition-colors flex-shrink-0",
                                            pathname === `/chat/${chat.id}` ? "text-law-gold" : "text-gray-600 group-hover:text-gray-400"
                                        )} />
                                        <span className="truncate font-medium">{chat.title}</span>
                                    </Link>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                setEditingId(chat.id)
                                                setEditTitle(chat.title || "")
                                            }}
                                            className="p-1.5 text-gray-600 hover:text-law-gold transition-colors"
                                        >
                                            {/* Edit Icon (Pencil) */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                setDeleteId(chat.id)
                                            }}
                                            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
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
    )
}
