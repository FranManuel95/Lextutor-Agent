import { requireAdmin } from "@/server/security/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlagsStatusFilter } from "./FlagsStatusFilter";
import { FlagsList } from "./FlagsList";
import { AdminExportButton } from "@/components/admin-export-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Flag = {
  id: string;
  user_id: string;
  attempt_id: string | null;
  session_id: string | null;
  question_id: string;
  question_text: string | null;
  area: string | null;
  reason: string;
  comment: string | null;
  status: string;
  created_at: string;
};

type Profile = { id: string; full_name: string | null };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUSES = ["open", "reviewed", "dismissed"] as const;

export default async function AdminFlagsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const status = STATUSES.includes(params.status as any) ? params.status! : "open";

  const adminSupabase = createAdminClient();

  const flagsRes = await adminSupabase
    .from("question_flags")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)
    .returns<Flag[]>();

  if (flagsRes.error) {
    return (
      <div className="p-8 text-red-400">Error cargando reportes: {flagsRes.error.message}</div>
    );
  }

  const flags = flagsRes.data ?? [];
  const userIds = Array.from(new Set(flags.map((f) => f.user_id)));

  const profilesRes =
    userIds.length > 0
      ? await adminSupabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)
          .returns<Profile[]>()
      : { data: [] as Profile[] };

  const profilesById = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name ?? "Sin nombre"])
  );

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-3xl italic text-law-gold">Reportes de preguntas</h2>
          <p className="text-gem-offwhite/60">
            Revisa los reportes enviados por los usuarios sobre preguntas con errores o
            ambigüedades.
          </p>
        </div>
        <AdminExportButton href="/api/admin/flags/export" />
      </div>

      <Card className="border-law-accent/20 bg-gem-slate">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-gem-offwhite">
            {flags.length} reporte{flags.length !== 1 ? "s" : ""}{" "}
            {status === "open"
              ? "sin revisar"
              : status === "reviewed"
                ? "revisados"
                : "descartados"}
          </CardTitle>
          <FlagsStatusFilter current={status} />
        </CardHeader>
        <CardContent>
          <FlagsList flags={flags} profilesById={profilesById} currentStatus={status} />
        </CardContent>
      </Card>
    </div>
  );
}
