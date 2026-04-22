"use client";

import Link from "next/link";
import { Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  current: string;
}

export function LeaderboardTabs({ current }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Métrica del ranking"
      className="flex rounded-lg border border-white/10 bg-black/30 p-1"
    >
      <Link
        href="/leaderboard?metric=score"
        role="tab"
        aria-selected={current === "score"}
        className={cn(
          "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition",
          current === "score"
            ? "bg-law-gold text-gem-onyx"
            : "text-gem-offwhite/60 hover:text-gem-offwhite"
        )}
      >
        <Star className="h-3.5 w-3.5" />
        Nota media
      </Link>
      <Link
        href="/leaderboard?metric=streak"
        role="tab"
        aria-selected={current === "streak"}
        className={cn(
          "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition",
          current === "streak"
            ? "bg-law-gold text-gem-onyx"
            : "text-gem-offwhite/60 hover:text-gem-offwhite"
        )}
      >
        <Flame className="h-3.5 w-3.5" />
        Racha
      </Link>
    </div>
  );
}
