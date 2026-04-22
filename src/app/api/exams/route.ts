import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const examStatsSchema = z.object({
  streak: z.number(),
  longestStreak: z.number(),
  lastActive: z.string().nullable(),
  averages: z.object({
    byType: z.record(z.number()),
    byArea: z.record(z.number()),
  }),
});

const DEFAULT_STATS = {
  streak: 0,
  longestStreak: 0,
  lastActive: null,
  averages: { byType: {}, byArea: {} },
};

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const area = searchParams.get("area");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  // 1. Fetch paginated items
  let query = supabase
    .from("exam_attempts")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== "all") {
    const validTypes = ["quiz", "exam_test", "exam_open"];
    if (validTypes.includes(type)) {
      query = query.eq("attempt_type", type as "quiz" | "exam_test" | "exam_open");
    }
  }

  if (area && area !== "all") {
    query = query.eq(
      "area",
      area as "laboral" | "civil" | "mercantil" | "procesal" | "otro" | "general"
    );
  }

  if (status && status !== "all") {
    if (["in_progress", "finished"].includes(status)) {
      query = query.eq("status", status as "in_progress" | "finished");
    }
  }

  // 2. Stats via SQL function — O(1) rows returned regardless of history size
  const [{ data: items, count, error }, { data: stats }] = await Promise.all([
    query,
    supabase.rpc("get_exam_stats", { p_user_id: user.id } as any),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const parsedStats = examStatsSchema.safeParse(stats);

  return NextResponse.json({
    items,
    count,
    stats: parsedStats.success ? parsedStats.data : DEFAULT_STATS,
  });
}
