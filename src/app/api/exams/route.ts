import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const area = searchParams.get('area')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 1. Fetch Paginated Items
    let query = supabase
        .from('exam_attempts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Explicit casts for strict typing in database.types
    if (type && type !== 'all') {
        const validTypes = ['quiz', 'exam_test', 'exam_open']
        if (validTypes.includes(type)) {
            query = query.eq('attempt_type', type as 'quiz' | 'exam_test' | 'exam_open')
        }
    }

    if (area && area !== 'all') {
        // We verify it's a non-empty string, but simply casting is usually enough if we trust the caller or don't care about 0 results for invalid inputs.
        // However, Supabase might error on invalid enum. Let's cast safely.
        query = query.eq('area', area as 'laboral' | 'civil' | 'mercantil' | 'procesal' | 'otro' | 'general')
    }

    if (status && status !== 'all') {
        if (['in_progress', 'finished'].includes(status)) {
            query = query.eq('status', status as 'in_progress' | 'finished')
        }
    }

    const { data: items, count, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 2. Calculate Stats & Streak (Fetch all simplified for math)
    // We only need finished attempts for stats
    const { data: allFinished } = await supabase
        .from('exam_attempts')
        .select('created_at, score, attempt_type, area')
        .eq('user_id', user.id)
        .eq('status', 'finished')
        .order('created_at', { ascending: true })
        .returns<Pick<Database['public']['Tables']['exam_attempts']['Row'], 'created_at' | 'score' | 'attempt_type' | 'area'>[]>() // important for streak

    // Streak Logic
    let currentStreak = 0
    let longestStreak = 0
    let lastActiveDate: Date | null = null

    if (allFinished && allFinished.length > 0) {
        // Group by date (YYYY-MM-DD)
        const activeDays = new Set<string>()
        allFinished.forEach(a => {
            activeDays.add(new Date(a.created_at).toISOString().split('T')[0])
        })

        const sortedDays = Array.from(activeDays).sort()

        // Calculate streaks
        let tempStreak = 0
        let prevDate: Date | null = null

        sortedDays.forEach(dayStr => {
            const currentDate = new Date(dayStr)

            if (!prevDate) {
                tempStreak = 1
            } else {
                const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (diffDays === 1) {
                    tempStreak++
                } else if (diffDays > 1) {
                    // broken streak
                    longestStreak = Math.max(longestStreak, tempStreak)
                    tempStreak = 1
                }
            }
            prevDate = currentDate
        })
        longestStreak = Math.max(longestStreak, tempStreak)

        // Check if current streak is active (today or yesterday)
        const today = new Date().toISOString().split('T')[0]
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterday = yesterdayDate.toISOString().split('T')[0]

        const lastDay = sortedDays[sortedDays.length - 1]
        if (lastDay === today || lastDay === yesterday) {
            currentStreak = tempStreak
        } else {
            currentStreak = 0
        }

        lastActiveDate = new Date(lastDay)
    }

    // Averages Logic
    const stats: any = {
        byType: {},
        byArea: {}
    }

    if (allFinished) {
        // By Type
        const types: ('quiz' | 'exam_test' | 'exam_open')[] = ['quiz', 'exam_test', 'exam_open']
        types.forEach(t => {
            const attempts = allFinished.filter(a => a.attempt_type === t)
            if (attempts.length > 0) {
                const total = attempts.reduce((sum, a) => sum + (a.score || 0), 0)
                stats.byType[t] = Math.round((total / attempts.length) * 10) / 10
            } else {
                stats.byType[t] = null
            }
        })

        // By Area (Overall)
        const distinctAreas = Array.from(new Set(allFinished.map(a => a.area)))

        distinctAreas.forEach(ar => {
            const attempts = allFinished.filter(a => a.area === ar)
            const total = attempts.reduce((sum, a) => sum + (a.score || 0), 0)
            stats.byArea[ar] = Math.round((total / attempts.length) * 10) / 10
        })
    }

    return NextResponse.json({
        items,
        count,
        stats: {
            streak: currentStreak,
            longestStreak,
            lastActive: lastActiveDate,
            averages: stats
        }
    })
}
