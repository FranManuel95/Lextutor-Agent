import { createClient } from '@/utils/supabase/server'
import { ChatList } from '@/features/chat/components/chat-list'
import { ChatInput } from '@/features/chat/components/chat-input'
import { ChatHeader } from '@/features/chat/components/chat-header'
import { redirect, notFound } from 'next/navigation'
import type { Database } from '@/types/database.types'

export default async function ChatIdPage({
    params
}: {
    params: Promise<{ chatId: string }>
}) {
    const { chatId } = await params
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify chat ownership
    const { data: chatData } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single()

    const chat = chatData as Database['public']['Tables']['chats']['Row'] | null

    if (!chat) {
        notFound()
    }

    // Fetch Profile for Avatar
    const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const profile = profileData as Database['public']['Tables']['profiles']['Row'] | null

    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

    return (
        <div className="flex flex-col h-full bg-gem-onyx pt-20 md:pt-0">
            <ChatHeader chatId={chat.id} title={chat.title || undefined} />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ChatList initialMessages={messages || []} userAvatar={profile?.avatar_url} />
            </div>
            <ChatInput chatId={chatId} />
        </div>
    )
}
