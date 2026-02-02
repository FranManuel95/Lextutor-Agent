import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
        return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    // Auth check (standard)
    const { createClient: createServerClient } = await import("@/utils/supabase/server");
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate Signed URL using Service Role (Private Bucket)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY missing");
        return NextResponse.json({ error: "Server Config Error" }, { status: 500 });
    }

    const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

    try {
        const { data, error: storageError } = await adminSupabase
            .storage
            .from('audio-notes')
            .createSignedUrl(path, 3600); // 1 hour validity

        if (storageError) throw storageError;

        return NextResponse.json({ signedUrl: data.signedUrl });

    } catch (error: any) {
        console.error("Signed URL Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
