import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Path traversal guard: path must belong to the authenticated user
  // Expected format: "<user_id>/<timestamp>.<ext>"
  const safePathPattern = /^[0-9a-f-]{36}\/[a-zA-Z0-9_\-]+\.(webm|mp3|wav|ogg|m4a)$/;
  if (!path.startsWith(`${user.id}/`) || !safePathPattern.test(path)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate Signed URL using Service Role (Private Bucket)
  const adminSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data, error: storageError } = await adminSupabase.storage
      .from("audio-notes")
      .createSignedUrl(path, 3600); // 1 hour validity

    if (storageError) throw storageError;

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    logger.error("audio/url signed URL failed", error, { userId: user.id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
