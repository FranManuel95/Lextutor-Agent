import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Target, TrendingUp, BookOpen, Clock, Activity } from "lucide-react";
import { Copyright } from "@/components/copyright";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Stats in Parallel
  const [answersRes, eventsRes] = await Promise.all([
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
  ]);

  const totalAnswers = answersRes.count;
  const events = eventsRes.data;

  const distribution: Record<string, number> = {};
  (events as any[])?.forEach((e) => {
    const area = e.area || "General";
    distribution[area] = (distribution[area] || 0) + 1;
  });

  // 3. Milestones (Mock logic for MVP display based on counts)
  const milestones = [
    {
      id: 1,
      title: "Iniciado",
      desc: "Primera pregunta realizada",
      unlocked: (totalAnswers || 0) >= 1,
      icon: BookOpen,
    },
    {
      id: 2,
      title: "Estudiante",
      desc: "10 preguntas completadas",
      unlocked: (totalAnswers || 0) >= 10,
      icon: Target,
    },
    {
      id: 3,
      title: "Experto",
      desc: "50 preguntas completadas",
      unlocked: (totalAnswers || 0) >= 50,
      icon: Trophy,
    },
    {
      id: 4,
      title: "Elite",
      desc: "100 preguntas completadas",
      unlocked: (totalAnswers || 0) >= 100,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      <div className="z-10 flex-none border-b border-white/5 bg-[#020617]/50 px-6 backdrop-blur-sm md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-6 md:pb-4 md:pt-8">
          <h1 className="text-shadow-sm font-serif text-3xl italic text-white">Mi Progreso</h1>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6 pt-3 md:px-16">
        <div className="mx-auto max-w-6xl space-y-8 pb-10">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gem-mist/20 p-6 shadow-lg shadow-black/20 transition-all hover:border-law-gold/30">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Activity size={80} />
              </div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                Total Preguntas
              </h3>
              <p className="font-mono text-5xl font-bold tracking-tight text-white">
                {totalAnswers || 0}
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gem-mist/20 p-6 shadow-lg shadow-black/20 transition-all hover:border-law-gold/30">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Clock size={80} />
              </div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                Racha Actual
              </h3>
              <p className="font-mono text-5xl font-bold tracking-tight text-law-gold">
                0 <span className="font-sans text-lg font-medium text-gray-500">días</span>
              </p>
              <p className="mt-2 text-xs font-medium text-gray-500">¡Sigue practicando!</p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gem-mist/20 p-6 shadow-lg shadow-black/20 transition-all hover:border-law-gold/30">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <BookOpen size={80} />
              </div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                Área Principal
              </h3>
              <p className="truncate font-serif text-3xl font-bold capitalize italic text-white">
                {Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
              </p>
              <p className="mt-2 text-xs font-medium text-gray-500">Tu materia más estudiada</p>
            </div>
          </div>

          {/* Distribution & Milestones */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Distribution List */}
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
        </div>
      </div>
    </div>
  );
}
