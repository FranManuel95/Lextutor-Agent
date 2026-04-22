import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AUDIO_UPLOAD_URL);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many upload requests." }, { status: 429 });
  }

  const adminSupabase = createAdminClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Path is server-generated under the authenticated user's namespace;
    // client never supplies it, so there is no traversal surface.
    const timestamp = Date.now();
    const path = `${user.id}/${timestamp}.webm`;

    const { data, error: storageError } = await adminSupabase.storage
      .from("audio-notes")
      .createSignedUploadUrl(path);

    if (storageError) throw storageError;

    return NextResponse.json({
      path,
      signedUrl: data.signedUrl,
      token: data.token,
    });
  } catch (error: any) {
    console.error("Upload URL Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
