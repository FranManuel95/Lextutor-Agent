import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
    const supabase = createClient()

    // Check if we can select the column directly
    const { data: selectData, error: selectError } = await supabase
        .from('exam_attempts')
        .select('attempt_type, area, score, status')
        .limit(1)

    // Check information schema (requires permissions, might fail but worth a shot if using service role)
    // We can't query info schema via client usually unless exposed.
    // So we rely on the select error.

    return NextResponse.json({
        selectCheck: {
            data: selectData,
            error: selectError
        },
        message: "If selectError is 'PGRST204', the API cache is definitely stale. If it's 'Column does not exist', the DB column is missing."
    })
}
