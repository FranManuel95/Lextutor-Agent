import { createClient } from '@/utils/supabase/server'
import { ChatSidebar } from './chat-sidebar'
import { getCachedChats } from '@/lib/data/get-chats'

export async function ChatSidebarLoader() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <ChatSidebar chats={[]} />

    const chats = await getCachedChats(user.id)

    return <ChatSidebar chats={chats} />
}
