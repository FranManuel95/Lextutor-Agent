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

  const [profilesRes, authRes] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, created_at"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
  }

  const emailsById = Object.fromEntries(
    (authRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const header = ["id", "full_name", "email", "role", "created_at"];
  const rows = [
    header,
    ...(profilesRes.data ?? []).map((p: any) => [
      p.id,
      p.full_name ?? "",
      emailsById[p.id] ?? "",
      p.role ?? "",
      p.created_at ?? "",
    ]),
  ];

  const filename = `lextutor-users-${format(new Date(), "yyyy-MM-dd")}.csv`;
  return csvResponse(filename, toCsv(rows));
}
