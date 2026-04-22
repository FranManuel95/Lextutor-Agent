import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/security/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { toCsv, csvResponse } from "@/lib/csv";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AREAS = ["laboral", "civil", "mercantil", "procesal", "otro", "general"];
const TYPES = ["quiz", "exam_test", "exam_open"];
const STATUSES = ["finished", "in_progress"];

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    const msg = e?.message ?? "Forbidden";
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { searchParams } = new URL(request.url);
  const areaRaw = searchParams.get("area");
  const typeRaw = searchParams.get("type");
  const statusRaw = searchParams.get("status");
  const area = areaRaw && AREAS.includes(areaRaw) ? areaRaw : undefined;
  const type = typeRaw && TYPES.includes(typeRaw) ? typeRaw : undefined;
  const status = statusRaw && STATUSES.includes(statusRaw) ? statusRaw : undefined;

  const admin = createAdminClient();

  let q = admin
    .from("exam_attempts")
    .select("id, user_id, attempt_type, area, score, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (area) q = q.eq("area", area as any);
  if (type) q = q.eq("attempt_type", type as any);
  if (status) q = q.eq("status", status as any);

  const attemptsRes = await q;

  if (attemptsRes.error) {
    return NextResponse.json({ error: attemptsRes.error.message }, { status: 500 });
  }

  const attempts = (attemptsRes.data ?? []) as any[];
  const userIds = Array.from(new Set(attempts.map((a) => a.user_id)));

  const profilesRes =
    userIds.length > 0
      ? await admin.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as any[] };
  const namesById = Object.fromEntries(
    (profilesRes.data ?? []).map((p: any) => [p.id, p.full_name ?? ""])
  );

  const header = [
    "id",
    "user_id",
    "full_name",
    "attempt_type",
    "area",
    "score",
    "status",
    "created_at",
  ];
  const rows = [
    header,
    ...attempts.map((a) => [
      a.id,
      a.user_id,
      namesById[a.user_id] ?? "",
      a.attempt_type ?? "",
      a.area ?? "",
      a.score ?? "",
      a.status ?? "",
      a.created_at ?? "",
    ]),
  ];

  const filename = `lextutor-exams-${format(new Date(), "yyyy-MM-dd")}.csv`;
  return csvResponse(filename, toCsv(rows));
}
