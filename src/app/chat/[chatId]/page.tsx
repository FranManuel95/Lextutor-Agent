import { createClient } from '@/utils/supabase/server'
import { ChatList } from '@/features/chat/components/chat-list'
import { ChatInput } from '@/features/chat/components/chat-input'
import { ChatHeader } from '@/features/chat/components/chat-header'
import { redirect, notFound } from 'next/navigation'
import type { Database } from '@/types/database.types'

export default async function ChatIdPage({
    params
}: {
    params: { chatId: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify chat ownership
    const { data: chat } = await supabase
        .from('chats')
        .select('id, title')
        .eq('id', params.chatId)
        .eq('user_id', user.id)
        .single()

    if (!chat) {
        notFound()
    }

    // Fetch Profile for Avatar
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Database['public']['Tables']['profiles']['Row'] | null }

    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', params.chatId)
        .order('created_at', { ascending: true })

    return (
        <div className="flex flex-col h-full bg-gem-onyx">
            <ChatHeader chatId={chat?.id!} title={chat?.title || undefined} />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ChatList initialMessages={messages || []} userAvatar={profile?.avatar_url} />
            </div>
            <ChatInput chatId={params.chatId} />
        </div>
    )
}
