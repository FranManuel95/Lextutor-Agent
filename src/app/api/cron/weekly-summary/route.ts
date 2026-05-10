import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7) === env.CRON_SECRET;
  }
  const { searchParams } = new URL(req.url);
  return searchParams.get("token") === env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "student");

    if (error) {
      throw error;
    }

    logger.info("weekly-summary cron triggered", { userCount: users?.length ?? 0 });

    return NextResponse.json({
      ok: true,
      processed: users?.length ?? 0,
    });
  } catch (err) {
    logger.error("weekly-summary cron failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
