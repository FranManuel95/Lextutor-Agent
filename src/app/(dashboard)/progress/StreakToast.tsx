"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  streak: number;
  longestStreak: number;
}

const SESSION_KEY = "progress_streak_toast_shown";

export function StreakToast({ streak, longestStreak }: Props) {
  const { toast } = useToast();

  useEffect(() => {
    if (streak < 3) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    const isRecord = streak === longestStreak && streak >= 3;
    const emoji = streak >= 30 ? "🏆" : streak >= 14 ? "⭐" : streak >= 7 ? "🔥" : "💪";

    toast({
      title: `${emoji} ¡Racha de ${streak} días!`,
      description: isRecord
        ? "Nuevo récord personal — sigue así para mantenerlo."
        : `Tu mejor racha es de ${longestStreak} días. ¡Ve a por ella!`,
    });

    sessionStorage.setItem(SESSION_KEY, "1");
  }, [streak, longestStreak, toast]);

  return null;
}
