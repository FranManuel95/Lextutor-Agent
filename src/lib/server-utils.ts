import { createClient } from '@/lib/supabase'
import { z } from 'zod';

export async function requireAdmin() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile as any).role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    return user
}

export const chatSchema = z.object({
    chatId: z.string().uuid(),
    message: z.string().min(1).max(2000),
    settings: z.object({
        area: z.string().optional(),
        modes: z.array(z.string()).optional(),
        detailLevel: z.string().optional(),
        preset: z.string().optional()
    }).optional()
});

// For upload we handle FormData, so schema is conceptual or used with zfd if available
// manual validation for now for files
