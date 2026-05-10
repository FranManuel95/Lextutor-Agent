import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Trophy, Flame, Star, Medal } from "lucide-react";
import { Copyright } from "@/components/copyright";
import { LeaderboardTabs } from "./LeaderboardTabs";

type Row = {
  user_id: string;
  first_name: string;
  initials: string;
  avatar_url: string | null;
  value: number;
  attempts?: number;
};

interface PageProps {
  searchParams: Promise<{ metric?: string }>;
}

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const metric = params.metric === "streak" ? "streak" : "score";

  const { data } = await supabase.rpc("get_leaderboard", {
    p_metric: metric,
    p_limit: 20,
  });

  const rows = (Array.isArray(data) ? (data as Row[]) : []).sort((a, b) => b.value - a.value);

  const currentUserRank = rows.findIndex((r) => r.user_id === user.id) + 1;

  const medalForRank = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: "text-law-gold", bg: "bg-law-gold/20" };
    if (rank === 2)
      return {
        icon: Medal,
        color: "text-gem-muted",
        bg: "bg-gem-muted/20",
      };
    if (rank === 3)
      return {
        icon: Medal,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-500/15",
      };
    return null;
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      <div className="z-10 flex-none border-b border-gem-border/40 bg-gem-onyx/80 px-4 backdrop-blur-sm sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center sm:py-6 md:pb-4 md:pt-8">
          <h1 className="text-shadow-sm font-serif text-2xl italic text-gem-offwhite sm:text-3xl">
            Ranking
          </h1>
          <LeaderboardTabs current={metric} />
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl space-y-6 pb-10">
          <div className="flex items-center gap-3 rounded-xl border border-law-gold/20 bg-law-gold/5 p-4 text-sm">
            {metric === "streak" ? (
              <Flame className="h-5 w-5 shrink-0 text-orange-400" />
            ) : (
              <Star className="h-5 w-5 shrink-0 text-law-gold" />
            )}
            <p className="text-gem-offwhite/80">
              {metric === "streak"
                ? "Ranking por racha actual de días consecutivos practicando."
                : "Ranking por nota media (mínimo 3 exámenes finalizados)."}
              {currentUserRank > 0 && (
                <span className="ml-2 font-semibold text-law-gold">
                  Estás en la posición #{currentUserRank}
                </span>
              )}
            </p>
          </div>

          {rows.length === 0 ? (
            <p className="py-16 text-center italic text-gem-offwhite/40">
              Aún no hay suficientes datos para el ranking. ¡Sé el primero!
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((r, i) => {
                const rank = i + 1;
                const medal = medalForRank(rank);
                const MedalIcon = medal?.icon;
                const isCurrent = r.user_id === user.id;

                return (
                  <div
                    key={r.user_id}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
                      isCurrent
                        ? "border-law-gold/50 bg-law-gold/10"
                        : rank <= 3
                          ? "border-law-gold/20 bg-gem-mist"
                          : "border-gem-border/40 bg-gem-mist"
                    }`}
                  >
                    <div className="flex h-8 w-10 shrink-0 items-center justify-center font-mono text-sm font-bold text-gem-offwhite/60">
                      #{rank}
                    </div>

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gem-border/40 ${
                        medal ? medal.bg : "bg-gem-slate"
                      }`}
                    >
                      {r.avatar_url ? (
                        <Image
                          src={r.avatar_url}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : MedalIcon ? (
                        <MedalIcon className={`h-5 w-5 ${medal!.color}`} />
                      ) : (
                        <span className="text-xs font-bold text-law-gold">{r.initials}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gem-offwhite">
                        {r.first_name}
                        {isCurrent && (
                          <span className="ml-2 rounded border border-law-gold/50 bg-law-gold/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-law-gold">
                            Tú
                          </span>
                        )}
                      </p>
                      {r.attempts !== undefined && (
                        <p className="text-xs text-gem-offwhite/40">{r.attempts} exámenes</p>
                      )}
                    </div>

                    <div
                      className={`shrink-0 font-mono text-lg font-bold ${
                        rank === 1
                          ? "text-law-gold"
                          : rank === 2
                            ? "text-gem-muted"
                            : rank === 3
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-gem-offwhite/80"
                      }`}
                    >
                      {metric === "streak" ? (
                        <>
                          {r.value}
                          <span className="ml-1 font-sans text-xs font-medium text-gem-offwhite/40">
                            días
                          </span>
                        </>
                      ) : (
                        <>
                          {r.value.toFixed(1)}
                          <span className="ml-0.5 font-sans text-xs font-medium text-gem-offwhite/40">
                            /10
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Copyright />
        </div>
      </div>
    </div>
  );
}
