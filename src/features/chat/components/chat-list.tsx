"use client"

import { useEffect, useRef, useMemo } from 'react'
import { ChatMessage } from './chat-message'
import { useAppStore } from '@/store/useAppStore'
import { Loader2 } from 'lucide-react'

interface ChatListProps {
    initialMessages: any[]
    userAvatar?: string | null
    chatId: string
}

export function ChatList({ initialMessages, userAvatar, chatId }: ChatListProps) {
    const { optimisticMessages, isSending } = useAppStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const prevMessagesLen = useRef(initialMessages.length)

    // Tech Lead Fix: Merge and Sort messages to prevent ordering issues
    const sortedMessages = useMemo(() => {
        // Filter optimistic messages for THIS chat only
        const currentChatOptimistic = optimisticMessages.filter(
            msg => msg.chat_id === chatId
        )
        const all = [...initialMessages, ...currentChatOptimistic]
        // Deduplicate by ID
        const unique = Array.from(new Map(all.map(m => [m.id, m])).values())
        // Sort by created_at
        return unique.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
    }, [initialMessages, optimisticMessages, chatId])

    useEffect(() => {
        const len = sortedMessages.length
        const isNewMessage = len > prevMessagesLen.current
        const lastMsg = sortedMessages[len - 1]

        // Strategy:
        // 1. If user sent a message (optimistic or real), scroll to bottom.
        // 2. If Assistant sent a message (new real message), scroll to the USER message before it (block: 'start').
        //    This keeps the user's question at the top of the view and the answer flows below.

        if (isNewMessage && lastMsg?.role === 'assistant') {
            // Find the user message ID just before this assistant message
            // Since initialMessages is the full history, finding it is easy.
            // We'll trust the structure is User -> Assistant usually.
            const userMsgIndex = len - 2
            if (userMsgIndex >= 0) {
                const userMsgId = sortedMessages[userMsgIndex].id
                const el = document.getElementById(`message-${userMsgId}`)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                } else {
                    // Fallback if element not found
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                }
            }
        } else {
            // Default: Scroll to bottom (User sent, or initial load)
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }

        prevMessagesLen.current = len
    }, [sortedMessages, isSending]) // Depend on sortedMessages

    return (
        <div className="flex flex-col pb-4">
            {/* Unified Message List */}
            {sortedMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gem-offwhite/40 italic mt-20">
                    <p>Comienza la conversación con tu tutor.</p>
                </div>
            ) : (
                sortedMessages.map((msg, index) => (
                    <ChatMessage
                        key={msg.id}
                        message={msg}
                        userAvatar={userAvatar}
                        // Check if it's the last message AND it's from assistant AND we are sending
                        isStreaming={isSending && index === sortedMessages.length - 1 && msg.role === 'assistant'}
                    />
                ))
            )}

            {/* Loading Indicator - Only show if NO assistant response yet */}
            {isSending && (!optimisticMessages.length || optimisticMessages[optimisticMessages.length - 1].role !== 'assistant') && (
                <div className="flex justify-start px-4 md:px-8 py-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 bg-gem-mist/10 rounded-2xl px-5 py-3 border border-law-accent/10">
                        <div className="w-8 h-8 rounded-full bg-law-gold/10 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-law-gold animate-spin" />
                        </div>
                        <span className="text-sm text-gem-offwhite/60 font-medium animate-pulse">
                            Tutor pensando...
                        </span>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
        </div>
    )
}
