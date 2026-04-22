import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

type DayData = { date: string; exams: number; messages: number };

export type AdminStats = {
  docsCount: number;
  usersCount: number;
  msgsCount: number;
  attemptsCount: number;
  activity: DayData[];
};

// Cache admin dashboard stats for 5 minutes. This is a heavy payload:
// 4 count queries + 1 RPC with generate_series. 5min is a safe tradeoff —
// the admin page is visited by a handful of people and doesn't need second-by-second freshness.
export const getCachedAdminStats = unstable_cache(
  async (): Promise<AdminStats> => {
    // Use service-role client: unstable_cache can't capture per-request cookies,
    // and this function is only called from the admin page which already gates access.
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const [docsRes, usersRes, msgsRes, attemptsRes, activityRes] = await Promise.all([
      supabase.from("rag_documents").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("exam_attempts").select("id", { count: "exact", head: true }),
      supabase.rpc("get_platform_activity", { p_days: 7 } as any),
    ]);

    return {
      docsCount: docsRes.count ?? 0,
      usersCount: usersRes.count ?? 0,
      msgsCount: msgsRes.count ?? 0,
      attemptsCount: attemptsRes.count ?? 0,
      activity: Array.isArray(activityRes.data) ? (activityRes.data as DayData[]) : [],
    };
  },
  ["admin-stats"],
  {
    revalidate: 300,
    tags: ["admin-stats"],
  }
);
