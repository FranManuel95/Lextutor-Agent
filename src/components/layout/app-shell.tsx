import { createClient } from '@/utils/supabase/server'
import { ChatSidebar } from '@/features/chat/components/chat-sidebar'
import { MobileSidebar } from '@/features/chat/components/mobile-sidebar'
import { redirect } from 'next/navigation'

export async function AppShell({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: chats } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    return (
        <div className="flex h-screen overflow-hidden">
            <aside className="hidden md:flex h-full">
                <ChatSidebar chats={chats || []} />
            </aside>
            <main className="flex-1 overflow-hidden bg-gem-onyx flex flex-col">
                <MobileSidebar chats={chats || []} />
                {children}
            </main>
        </div>
    )
}
