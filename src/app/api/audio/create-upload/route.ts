import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    // 1. Verify User (Standard Client)
    const authHeader = request.headers.get('Authorization');
    // Wait, we are in App Router server component/route. We use utils/supabase/server to get session.
    // However, to Generate Signed Upload URL that Bypass RLS (or if RLS is tricky), we can use Service Role.
    // Let's use Service Role for the Storage operation to ensure it works, assuming the User is Authenticated.

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
        return NextResponse.json(
            { error: "Server Configuration Error: Missing Service Role Key" },
            { status: 500 }
        );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify Auth via standard client (optional but good for security context if we trust the cookie)
    // Actually, let's just use the admin client to generate the URL for the `user.id` contained in the request (or validated session).

    // We need validation.
    const { createClient: createServerClient } = await import("@/utils/supabase/server");
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const timestamp = Date.now();
        const path = `${user.id}/${timestamp}.webm`;

        // Use Admin Client to create signed URL to ensure no RLS "Policy not found" error
        const { data, error: storageError } = await adminSupabase
            .storage
            .from('audio-notes')
            .createSignedUploadUrl(path);

        if (storageError) throw storageError;

        return NextResponse.json({
            path,
            signedUrl: data.signedUrl,
            token: data.token
        });

    } catch (error: any) {
        console.error("Upload URL Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
