import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  Activity,
  Star,
  Flame,
  ChevronRight,
} from "lucide-react";
import { Copyright } from "@/components/copyright";
import { ProgressExportButton } from "./ProgressExportButton";
import { StreakToast } from "./StreakToast";

type ExamStats = {
  streak: number;
  longestStreak: number;
  lastActive: string | null;
  averages: {
    byType: Record<string, number>;
    byArea: Record<string, number>;
  };
};

const DEFAULT_STATS: ExamStats = {
  streak: 0,
  longestStreak: 0,
  lastActive: null,
  averages: { byType: {}, byArea: {} },
};

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [answersRes, eventsRes, statsRes, totalExamsRes, recentExamsRes] = await Promise.all([
    supabase
      .from("student_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("kind", "answer_submitted"),
    supabase
      .from("student_events")
      .select("area, kind")
      .eq("user_id", user.id)
      .eq("kind", "answer_submitted")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.rpc("get_exam_stats", { p_user_id: user.id } as any),
    supabase
      .from("exam_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "finished"),
    supabase
      .from("exam_attempts")
      .select("id, area, attempt_type, score, created_at")
      .eq("user_id", user.id)
      .eq("status", "finished")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalAnswers = answersRes.count ?? 0;
  const totalExams = totalExamsRes.count ?? 0;
  const events = eventsRes.data ?? [];
  const stats: ExamStats = (statsRes.data as unknown as ExamStats) ?? DEFAULT_STATS;
  const recentExams = (recentExamsRes.data ?? []) as Array<{
    id: string;
    area: string | null;
    attempt_type: string | null;
    score: number | null;
    created_at: string;
  }>;

  const distribution: Record<string, number> = {};
  events.forEach((e: any) => {
    const area = e.area || "General";
    distribution[area] = (distribution[area] || 0) + 1;
  });

  const topArea = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Overall average score across all attempts
  const areaScores = Object.entries(stats.averages.byArea);
  const overallAvg =
    areaScores.length > 0
      ? Math.round((areaScores.reduce((sum, [, v]) => sum + v, 0) / areaScores.length) * 10) / 10
      : null;

  const milestones = [
    {
      id: 1,
      title: "Iniciado",
      desc: "Primera pregunta realizada",
      unlocked: totalAnswers >= 1,
      icon: BookOpen,
    },
    {
      id: 2,
      title: "Estudiante",
      desc: "10 preguntas completadas",
      unlocked: totalAnswers >= 10,
      icon: Target,
    },
    {
      id: 3,
      title: "Experto",
      desc: "50 preguntas completadas",
      unlocked: totalAnswers >= 50,
      icon: Trophy,
    },
    {
      id: 4,
      title: "Elite",
      desc: "100 preguntas completadas",
      unlocked: totalAnswers >= 100,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      {/* Header */}
      <div className="z-10 flex-none border-b border-white/5 bg-[#020617]/50 px-6 backdrop-blur-sm md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-6 md:pb-4 md:pt-8">
          <h1 className="text-shadow-sm font-serif text-3xl italic text-white">Mi Progreso</h1>
          <ProgressExportButton
            data={{
              totalAnswers,
              distribution,
              milestones: milestones.map(({ title, desc, unlocked }) => ({
                title,
                desc,
                unlocked,
              })),
              generatedAt: new Date().toLocaleString("es-ES"),
            }}
          />
        </div>
      </div>

      <StreakToast streak={stats.streak} longestStreak={stats.longestStreak} />

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6 pt-3 md:px-16">
        <div className="mx-auto max-w-6xl space-y-8 pb-10">
          {/* KPI Row 1 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <KpiCard icon={Activity} label="Total Preguntas" value={totalAnswers} unit="" />

            <KpiCard
              icon={Flame}
              label="Racha Actual"
              value={stats.streak}
              unit="días"
              highlight
              sub={stats.streak > 0 ? `Máxima: ${stats.longestStreak} días` : "¡Sigue practicando!"}
            />

            <KpiCard
              icon={BookOpen}
              label="Área Principal"
              value={topArea ?? "N/A"}
              unit=""
              italic
              sub="Tu materia más estudiada"
            />
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <KpiCard
              icon={Star}
              label="Nota Media"
              value={overallAvg !== null ? overallAvg : "—"}
              unit={overallAvg !== null ? "/10" : ""}
              sub={totalExams === 0 ? "Sin exámenes aún" : `${totalExams} exámenes realizados`}
            />

            <KpiCard
              icon={Trophy}
              label="Exámenes Realizados"
              value={totalExams}
              unit=""
              sub={stats.longestStreak > 0 ? `Mejor racha: ${stats.longestStreak} días` : ""}
            />

            <KpiCard
              icon={Clock}
              label="Último Estudio"
              value={
                stats.lastActive
                  ? new Date(stats.lastActive).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "—"
              }
              unit=""
              sub={stats.lastActive ? "Fecha último examen" : "Sin actividad aún"}
            />
          </div>

          {/* Scores by area */}
          {areaScores.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6 shadow-inner">
              <h3 className="mb-6 flex items-center gap-2 font-serif text-xl text-white">
                <Star size={20} className="text-law-gold" />
                Nota Media por Materia
              </h3>
              <div className="space-y-4">
                {areaScores
                  .sort((a, b) => b[1] - a[1])
                  .map(([area, score]) => (
                    <div key={area} className="group">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium capitalize text-gray-200 transition-colors group-hover:text-law-gold">
                          {area}
                        </span>
                        <span
                          className={`font-mono font-bold ${score >= 5 ? "text-green-400" : "text-red-400"}`}
                        >
                          {score}/10
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full border border-white/5 bg-black/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            score >= 7
                              ? "bg-gradient-to-r from-green-500 to-emerald-400"
                              : score >= 5
                                ? "bg-gradient-to-r from-yellow-500 to-law-gold"
                                : "bg-gradient-to-r from-red-600 to-red-400"
                          }`}
                          style={{ width: `${(score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Distribution & Milestones */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Distribution */}
            <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6 shadow-inner">
              <h3 className="mb-6 flex items-center gap-2 font-serif text-xl text-white">
                <Target size={20} className="text-law-gold" />
                Distribución por Materia
              </h3>
              <div className="space-y-4">
                {Object.entries(distribution).length === 0 ? (
                  <p className="text-sm italic text-gray-500">Aún no hay datos registrados.</p>
                ) : (
                  Object.entries(distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([area, count]) => (
                      <div key={area} className="group">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-medium capitalize text-gray-200 transition-colors group-hover:text-law-gold">
                            {area}
                          </span>
                          <span className="font-mono font-bold text-white">{count}</span>
                        </div>
                        <div className="h-4 w-full overflow-hidden rounded-full border border-white/5 bg-black/40">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-law-gold to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all duration-500"
                            style={{ width: `${(count / (totalAnswers || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Milestones */}
            <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6 shadow-inner">
              <h3 className="mb-6 flex items-center gap-2 font-serif text-xl text-white">
                <Trophy size={20} className="text-law-gold" />
                Hitos Desbloqueados
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {milestones.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${
                        m.unlocked
                          ? "border-law-gold/30 bg-law-gold/5 hover:bg-law-gold/10"
                          : "border-white/5 bg-black/20 opacity-50 grayscale"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 rounded-full p-3 ${m.unlocked ? "bg-law-gold text-gem-onyx shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "bg-gray-800 text-gray-500"}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`text-sm font-bold ${m.unlocked ? "text-white" : "text-gray-400"}`}
                        >
                          {m.title}
                        </h4>
                        <p className="truncate text-xs text-gray-500">{m.desc}</p>
                      </div>
                      {m.unlocked && (
                        <div className="ml-auto rounded border border-law-gold/50 bg-law-gold/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-law-gold">
                          Hecho
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent exams */}
          {recentExams.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6 shadow-inner">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-serif text-xl text-white">
                  <Trophy size={20} className="text-law-gold" />
                  Últimos Exámenes
                </h3>
                <Link
                  href="/exams"
                  className="flex items-center gap-1 text-xs text-law-gold/80 hover:text-law-gold"
                >
                  Ver todos
                  <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-2">
                {recentExams.map((ex) => {
                  const score = Number(ex.score ?? 0);
                  const typeLabel =
                    ex.attempt_type === "quiz"
                      ? "Quiz"
                      : ex.attempt_type === "exam_test"
                        ? "Test"
                        : ex.attempt_type === "exam_open"
                          ? "Abierto"
                          : "Examen";
                  return (
                    <Link
                      key={ex.id}
                      href={`/exams/${ex.id}`}
                      className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-law-gold/30 hover:bg-law-gold/5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {typeLabel}
                          </span>
                          <span className="truncate font-medium capitalize text-gray-200">
                            {ex.area || "General"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(ex.created_at).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div
                        className={`font-mono text-lg font-bold ${
                          score >= 7
                            ? "text-green-400"
                            : score >= 5
                              ? "text-law-gold"
                              : "text-red-400"
                        }`}
                      >
                        {score.toFixed(1)}
                        <span className="ml-0.5 text-xs font-medium text-gray-500">/10</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="ml-3 text-gray-600 transition group-hover:text-law-gold"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <Copyright />
        </div>
      </div>
    </div>
  );
}

// ── Shared KPI card ─────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  highlight,
  italic,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  highlight?: boolean;
  italic?: boolean;
  sub?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gem-mist/20 p-6 shadow-lg shadow-black/20 transition-all hover:border-law-gold/30">
      <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
        <Icon size={80} />
      </div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</h3>
      <p
        className={`font-mono text-5xl font-bold tracking-tight ${highlight ? "text-law-gold" : "text-white"} ${italic ? "font-serif italic" : ""}`}
      >
        {typeof value === "number" ? value.toLocaleString("es-ES") : value}
        {unit && <span className="ml-1 font-sans text-lg font-medium text-gray-500">{unit}</span>}
      </p>
      {sub && <p className="mt-2 text-xs font-medium text-gray-500">{sub}</p>}
    </div>
  );
}
