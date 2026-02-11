import { createClient } from '@/utils/supabase/server'
import { ChatSidebarLoader } from '@/features/chat/components/chat-sidebar-loader'
import { MobileSidebarLoader } from '@/features/chat/components/mobile-sidebar-loader'
import { SidebarSkeleton } from '@/features/chat/components/sidebar-skeleton'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Cache sidebar data for 30 seconds
export const revalidate = 30

export async function AppShell({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()

    // Fast Auth Check only
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <aside className="hidden md:flex h-full">
                <Suspense fallback={<SidebarSkeleton />}>
                    <ChatSidebarLoader />
                </Suspense>
            </aside>
            <main className="flex-1 overflow-hidden bg-gem-onyx flex flex-col">
                <Suspense fallback={<div className="h-14 border-b border-white/5 bg-gem-onyx flex items-center px-4"><Skeleton className="h-8 w-8 rounded-md bg-white/10" /></div>}>
                    <MobileSidebarLoader />
                </Suspense>
                {children}
            </main>
        </div>
    )
}

