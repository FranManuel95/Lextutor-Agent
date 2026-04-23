import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/security/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { toCsv, csvResponse } from "@/lib/csv";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    const msg = e?.message ?? "Forbidden";
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const admin = createAdminClient();
  const flagsRes = await admin
    .from("question_flags")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (flagsRes.error) {
    return NextResponse.json({ error: flagsRes.error.message }, { status: 500 });
  }

  const flags = flagsRes.data ?? [];
  const userIds = Array.from(new Set(flags.map((f) => f.user_id)));

  type ProfileRow = { id: string; full_name: string | null };
  const profilesRes =
    userIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)
          .returns<ProfileRow[]>()
      : { data: [] as ProfileRow[] };
  const namesById = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name ?? ""])
  );

  const header = [
    "id",
    "user_id",
    "full_name",
    "attempt_id",
    "question_id",
    "question_text",
    "area",
    "reason",
    "comment",
    "status",
    "created_at",
  ];
  const rows = [
    header,
    ...flags.map((f) => [
      f.id,
      f.user_id,
      namesById[f.user_id] ?? "",
      f.attempt_id ?? "",
      f.question_id ?? "",
      f.question_text ?? "",
      f.area ?? "",
      f.reason,
      f.comment ?? "",
      f.status,
      f.created_at,
    ]),
  ];

  const filename = `lextutor-flags-${format(new Date(), "yyyy-MM-dd")}.csv`;
  return csvResponse(filename, toCsv(rows));
}
