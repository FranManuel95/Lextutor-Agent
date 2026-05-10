import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/security/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { toCsv, csvResponse } from "@/lib/csv";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AREAS = ["laboral", "civil", "mercantil", "procesal", "otro", "general"] as const;
const TYPES = ["quiz", "exam_test", "exam_open"] as const;
const STATUSES = ["finished", "in_progress"] as const;

type AttemptRow = {
  id: string;
  user_id: string;
  attempt_type: string | null;
  area: string | null;
  score: number | null;
  status: string | null;
  created_at: string;
};

function fromArray<T extends readonly string[]>(arr: T, val: string | null): T[number] | undefined {
  return val !== null && arr.includes(val as T[number]) ? (val as T[number]) : undefined;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { searchParams } = new URL(request.url);
  const area = fromArray(AREAS, searchParams.get("area"));
  const type = fromArray(TYPES, searchParams.get("type"));
  const status = fromArray(STATUSES, searchParams.get("status"));

  const admin = createAdminClient();

  let q = admin
    .from("exam_attempts")
    .select("id, user_id, attempt_type, area, score, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (area) q = q.eq("area", area);
  if (type) q = q.eq("attempt_type", type);
  if (status) q = q.eq("status", status);

  const attemptsRes = await q;

  if (attemptsRes.error) {
    return NextResponse.json({ error: attemptsRes.error.message }, { status: 500 });
  }

  const attempts = (attemptsRes.data ?? []) as AttemptRow[];
  const userIds = Array.from(new Set(attempts.map((a) => a.user_id)));

  const profilesRes =
    userIds.length > 0
      ? await admin.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const namesById = Object.fromEntries(
    (profilesRes.data ?? []).map((p: { id: string; full_name: string | null }) => [
      p.id,
      p.full_name ?? "",
    ])
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
