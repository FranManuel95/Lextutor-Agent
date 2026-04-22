"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

type DayData = {
  date: string;
  exams: number;
  messages: number;
};

interface Props {
  data: DayData[];
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
}

export function ActivityChart({ data }: Props) {
  const maxMessages = Math.max(...data.map((d) => d.messages), 1);
  const maxExams = Math.max(...data.map((d) => d.exams), 1);
  const globalMax = Math.max(maxMessages, maxExams, 1);

  const totalExams = data.reduce((s, d) => s + d.exams, 0);
  const totalMessages = data.reduce((s, d) => s + d.messages, 0);

  return (
    <section
      aria-label="Gráfico de actividad de los últimos 7 días"
      className="rounded-2xl border border-law-accent/20 bg-gem-slate p-4 sm:p-6"
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-serif text-lg text-law-gold sm:text-xl">
          <BarChart3 size={20} aria-hidden="true" />
          Actividad últimos 7 días
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gem-offwhite/60 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-law-gold/80" />
            Exámenes ({totalExams})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-400/80" />
            Mensajes ({totalMessages})
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex h-40 items-end gap-2">
        {data.map((day) => {
          const examPct = (day.exams / globalMax) * 100;
          const msgPct = (day.messages / globalMax) * 100;
          return (
            <div key={day.date} className="group flex flex-1 flex-col items-center gap-1">
              <div className="relative flex w-full flex-1 items-end gap-0.5">
                {/* Messages bar */}
                <div className="relative flex-1" title={`${day.messages} mensajes`}>
                  <div
                    className="w-full rounded-t-sm bg-purple-400/60 transition-all duration-500 group-hover:bg-purple-400/80"
                    style={{ height: `${msgPct}%`, minHeight: day.messages > 0 ? "4px" : "0" }}
                  />
                </div>
                {/* Exams bar */}
                <div className="relative flex-1" title={`${day.exams} exámenes`}>
                  <div
                    className="w-full rounded-t-sm bg-law-gold/70 transition-all duration-500 group-hover:bg-law-gold"
                    style={{ height: `${examPct}%`, minHeight: day.exams > 0 ? "4px" : "0" }}
                  />
                </div>
              </div>
              <span className="text-[10px] capitalize text-gem-offwhite/50">
                {shortDay(day.date)}
              </span>
            </div>
          );
        })}
      </div>

      {data.every((d) => d.exams === 0 && d.messages === 0) && (
        <p className="mt-4 text-center text-sm italic text-gem-offwhite/30">
          Sin actividad registrada esta semana
        </p>
      )}
    </section>
  );
}
