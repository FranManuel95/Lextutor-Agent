import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { requireAdmin } from "@/server/security/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlagsStatusFilter } from "./FlagsStatusFilter";
import { FlagRowActions } from "./FlagRowActions";

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

const REASON_LABEL: Record<string, string> = {
  incorrect: "Respuesta incorrecta",
  ambiguous: "Ambigua",
  off_topic: "Fuera de tema",
  other: "Otro",
};

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
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl italic text-law-gold">Reportes de preguntas</h2>
        <p className="text-gem-offwhite/60">
          Revisa los reportes enviados por los usuarios sobre preguntas con errores o ambigüedades.
        </p>
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
        <CardContent className="space-y-3">
          {flags.length === 0 ? (
            <p className="py-8 text-center italic text-gem-offwhite/40">
              No hay reportes en este estado.
            </p>
          ) : (
            flags.map((f) => (
              <div
                key={f.id}
                className="space-y-3 rounded-lg border border-law-accent/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        f.reason === "incorrect"
                          ? "bg-red-500/10 text-red-400"
                          : f.reason === "ambiguous"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : f.reason === "off_topic"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-white/10 text-white"
                      }
                    >
                      {REASON_LABEL[f.reason] ?? f.reason}
                    </Badge>
                    {f.area && (
                      <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gem-offwhite/60">
                        {f.area}
                      </span>
                    )}
                    <Link
                      href={`/admin/users/${f.user_id}`}
                      className="text-xs text-gem-offwhite/60 hover:text-law-gold"
                    >
                      {profilesById[f.user_id] ?? "Sin nombre"}
                    </Link>
                    <span className="text-xs text-gem-offwhite/40">
                      {format(new Date(f.created_at), "PPp", { locale: es })}
                    </span>
                  </div>
                  <FlagRowActions flagId={f.id} currentStatus={f.status} />
                </div>

                {f.question_text && (
                  <p className="text-sm italic text-gem-offwhite">
                    &ldquo;{f.question_text}&rdquo;
                  </p>
                )}

                {f.comment && (
                  <p className="rounded border border-white/5 bg-black/30 px-3 py-2 text-xs text-gem-offwhite/80">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gem-offwhite/40">
                      Comentario del usuario
                    </span>
                    {f.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
