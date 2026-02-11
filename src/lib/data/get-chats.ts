import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { Chat } from '@/types/chat'

export const getCachedChats = async (userId: string) => {
    const getChats = unstable_cache(
        async () => {
            // Use Admin Client to bypass cookies requirements context in cache
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            const { data } = await supabase
                .from('chats')
                .select('id, title, updated_at')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(50)

            return (data as Chat[]) || []
        },
        ['user-chats', userId],
        {
            revalidate: 3600,
            tags: ['chats', `chats-${userId}`]
        }
    )

    return getChats()
}
