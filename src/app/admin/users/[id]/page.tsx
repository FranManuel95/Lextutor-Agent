import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Activity,
  Trophy,
  Flame,
  Clock,
  MessageSquare,
  FileText,
  CheckCircle,
} from "lucide-react";
import { requireAdmin } from "@/server/security/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type ExamStats = {
  streak: number;
  longestStreak: number;
  lastActive: string | null;
  averages: { byType: Record<string, number>; byArea: Record<string, number> };
};

type StudentEvent = {
  id: string;
  kind: string;
  area: string | null;
  payload: any;
  created_at: string;
};

type ExamAttempt = {
  id: string;
  attempt_type: string | null;
  area: string | null;
  score: number | null;
  status: string | null;
  created_at: string;
};

function eventLabel(kind: string): { label: string; icon: typeof Activity } {
  switch (kind) {
    case "answer_submitted":
      return { label: "Respuesta enviada", icon: CheckCircle };
    case "milestone_unlocked":
      return { label: "Hito desbloqueado", icon: Trophy };
    case "chat_message":
      return { label: "Mensaje de chat", icon: MessageSquare };
    default:
      return { label: kind, icon: Activity };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  // Gate: throws if not admin.
  await requireAdmin();

  const adminSupabase = createAdminClient();

  const [profileRes, authUserRes, eventsRes, attemptsRes, statsRes] = await Promise.all([
    adminSupabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    adminSupabase.auth.admin.getUserById(id),
    adminSupabase
      .from("student_events")
      .select("id, kind, area, payload, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    adminSupabase
      .from("exam_attempts")
      .select("id, attempt_type, area, score, status, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    adminSupabase.rpc("get_exam_stats", { p_user_id: id }),
  ]);

  if (!profileRes.data) {
    notFound();
  }

  const profile = profileRes.data;
  const email = authUserRes.data.user?.email ?? "sin email";
  const events = (eventsRes.data ?? []) as StudentEvent[];
  const attempts = (attemptsRes.data ?? []) as ExamAttempt[];
  const stats = (statsRes.data as unknown as ExamStats) ?? {
    streak: 0,
    longestStreak: 0,
    lastActive: null,
    averages: { byType: {}, byArea: {} },
  };

  const role = profile.role ?? "student";
  const finishedAttempts = attempts.filter((a) => a.status === "finished");
  const avgScore =
    finishedAttempts.length > 0
      ? Math.round(
          (finishedAttempts.reduce((s, a) => s + Number(a.score ?? 0), 0) /
            finishedAttempts.length) *
            10
        ) / 10
      : null;

  return (
    <div className="space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-gem-offwhite/60 hover:text-law-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a usuarios
      </Link>

      {/* Header card */}
      <Card className="border-law-accent/20 bg-gem-slate">
        <CardContent className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <Avatar className="h-16 w-16 border border-law-gold/40 sm:h-20 sm:w-20">
            <AvatarImage src={profile.avatar_url ?? ""} />
            <AvatarFallback className="bg-law-primary text-lg text-law-gold">
              {profile.full_name?.slice(0, 2).toUpperCase() ?? "US"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words font-serif text-xl italic text-white sm:text-2xl">
                {profile.full_name ?? "Sin nombre"}
              </h1>
              <Badge
                className={
                  role === "admin"
                    ? "bg-law-gold text-gem-onyx hover:bg-law-gold/80"
                    : "bg-white/10 text-white hover:bg-white/20"
                }
              >
                {role}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gem-offwhite/60">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {email}
              </span>
              {profile.created_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Desde {format(new Date(profile.created_at), "PPP", { locale: es })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={Trophy} label="Exámenes" value={finishedAttempts.length} color="text-law-gold" />
        <Kpi
          icon={Activity}
          label="Nota Media"
          value={avgScore !== null ? `${avgScore}/10` : "—"}
          color={avgScore !== null && avgScore >= 5 ? "text-green-400" : "text-red-400"}
        />
        <Kpi icon={Flame} label="Racha" value={`${stats.streak} días`} color="text-orange-400" />
        <Kpi
          icon={Clock}
          label="Último activo"
          value={
            stats.lastActive ? format(new Date(stats.lastActive), "PP", { locale: es }) : "Nunca"
          }
          color="text-blue-400"
        />
      </div>

      {/* Two-column: recent exams + timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent exams */}
        <Card className="border-law-accent/20 bg-gem-slate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gem-offwhite">
              <FileText className="h-4 w-4 text-law-gold" />
              Últimos exámenes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attempts.length === 0 ? (
              <p className="text-sm italic text-gem-offwhite/40">Sin exámenes registrados.</p>
            ) : (
              attempts.map((a) => {
                const score = Number(a.score ?? 0);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-law-accent/10 bg-black/20 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize text-gem-offwhite">
                        {a.area || "General"}{" "}
                        <span className="text-xs text-gem-offwhite/40">
                          · {a.attempt_type ?? "examen"}
                        </span>
                      </p>
                      <p className="text-xs text-gem-offwhite/40">
                        {format(new Date(a.created_at), "PPp", { locale: es })}
                      </p>
                    </div>
                    {a.status === "finished" ? (
                      <span
                        className={`font-mono text-sm font-bold ${
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
                      <Badge className="bg-gray-700 text-gray-300">en curso</Badge>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Activity timeline */}
        <Card className="border-law-accent/20 bg-gem-slate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gem-offwhite">
              <Activity className="h-4 w-4 text-law-gold" />
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm italic text-gem-offwhite/40">Sin eventos registrados.</p>
            ) : (
              <ol className="relative space-y-3 border-l border-law-accent/20 pl-6">
                {events.map((e) => {
                  const { label, icon: Icon } = eventLabel(e.kind);
                  return (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-gem-slate ring-2 ring-law-accent/30">
                        <Icon className="h-3 w-3 text-law-gold" />
                      </span>
                      <p className="text-sm text-gem-offwhite">
                        {label}
                        {e.area && (
                          <span className="ml-2 text-xs italic text-gem-offwhite/50">
                            · {e.area}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gem-offwhite/40">
                        {format(new Date(e.created_at), "PPpp", { locale: es })}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="border-law-accent/20 bg-gem-slate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-gem-offwhite/50">
            {label}
          </p>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className={`mt-1 font-mono text-xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
