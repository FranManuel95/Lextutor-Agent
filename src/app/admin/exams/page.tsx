import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { requireAdmin } from "@/server/security/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExamsFilters } from "./ExamsFilters";
import { ExamsPagination } from "./ExamsPagination";
import { AdminExportButton } from "@/components/admin-export-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type ExamRow = {
  id: string;
  user_id: string;
  attempt_type: string | null;
  area: string | null;
  score: number | null;
  status: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    area?: string;
    type?: string;
    status?: string;
  }>;
}

const AREAS = ["laboral", "civil", "mercantil", "procesal", "otro", "general"] as const;
const TYPES = ["quiz", "exam_test", "exam_open"] as const;
const STATUSES = ["finished", "in_progress"] as const;

export default async function AdminExamsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const rawPage = parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const area = AREAS.includes(params.area as any) ? params.area! : undefined;
  const attemptType = TYPES.includes(params.type as any) ? params.type! : undefined;
  const status = STATUSES.includes(params.status as any) ? params.status! : undefined;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const adminSupabase = createAdminClient();

  let query = adminSupabase
    .from("exam_attempts")
    .select("id, user_id, attempt_type, area, score, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (area) query = query.eq("area", area as any);
  if (attemptType) query = query.eq("attempt_type", attemptType as any);
  if (status) query = query.eq("status", status as any);

  const attemptsRes = await query.returns<ExamRow[]>();

  if (attemptsRes.error) {
    return (
      <div className="p-8 text-red-400">Error cargando exámenes: {attemptsRes.error.message}</div>
    );
  }

  const attempts = attemptsRes.data ?? [];
  const userIds = Array.from(new Set(attempts.map((a) => a.user_id)));

  // Fetch profiles in a single batch (may exceed 1 request if many users; limited by PAGE_SIZE)
  const profilesRes =
    userIds.length > 0
      ? await adminSupabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)
          .returns<ProfileRow[]>()
      : { data: [] as ProfileRow[], error: null };

  const profilesById = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.id, p.full_name]));

  const totalCount = attemptsRes.count ?? attempts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const typeLabel = (t: string | null) => {
    switch (t) {
      case "quiz":
        return "Quiz";
      case "exam_test":
        return "Test";
      case "exam_open":
        return "Abierto";
      default:
        return t ?? "—";
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-3xl italic text-law-gold">Exámenes de la plataforma</h2>
          <p className="text-gem-offwhite/60">
            Todos los intentos de quiz, test y examen abierto realizados por los usuarios.
          </p>
        </div>
        <AdminExportButton
          href={(() => {
            const p = new URLSearchParams();
            if (area) p.set("area", area);
            if (attemptType) p.set("type", attemptType);
            if (status) p.set("status", status);
            const qs = p.toString();
            return `/api/admin/exams/export${qs ? `?${qs}` : ""}`;
          })()}
        />
      </div>

      <Card className="border-law-accent/20 bg-gem-slate">
        <CardHeader>
          <CardTitle className="text-gem-offwhite">
            {totalCount.toLocaleString()} intento{totalCount !== 1 ? "s" : ""}
            {totalPages > 1 && (
              <span className="ml-2 text-sm font-normal text-gem-offwhite/50">
                (página {page} de {totalPages})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExamsFilters
            currentArea={area ?? "all"}
            currentType={attemptType ?? "all"}
            currentStatus={status ?? "all"}
          />

          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow className="border-law-accent/20 hover:bg-white/5">
                  <TableHead className="text-law-gold">Usuario</TableHead>
                  <TableHead className="text-law-gold">Tipo</TableHead>
                  <TableHead className="text-law-gold">Área</TableHead>
                  <TableHead className="text-law-gold">Nota</TableHead>
                  <TableHead className="text-law-gold">Estado</TableHead>
                  <TableHead className="text-law-gold">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => {
                  const userName = profilesById[a.user_id] ?? "Sin nombre";
                  const score = Number(a.score ?? 0);
                  return (
                    <TableRow key={a.id} className="border-law-accent/10 hover:bg-white/5">
                      <TableCell className="font-medium text-gem-offwhite">
                        <Link href={`/admin/users/${a.user_id}`} className="hover:text-law-gold">
                          {userName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-white/5 text-gem-offwhite/80">
                          {typeLabel(a.attempt_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-gem-offwhite/80">
                        {a.area || "general"}
                      </TableCell>
                      <TableCell>
                        {a.status === "finished" ? (
                          <span
                            className={`font-mono font-bold ${
                              score >= 7
                                ? "text-green-400"
                                : score >= 5
                                  ? "text-law-gold"
                                  : "text-red-400"
                            }`}
                          >
                            {score.toFixed(1)}/10
                          </span>
                        ) : (
                          <span className="text-xs italic text-gem-offwhite/40">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            a.status === "finished"
                              ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                              : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                          }
                        >
                          {a.status === "finished" ? "Finalizado" : "En curso"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gem-offwhite/60">
                        {format(new Date(a.created_at), "PPp", { locale: es })}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {attempts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center italic text-gem-offwhite/40">
                      Sin resultados para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <ExamsPagination
              currentPage={page}
              totalPages={totalPages}
              area={area}
              type={attemptType}
              status={status}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
