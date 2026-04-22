"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, XCircle, RotateCcw, Loader2 } from "lucide-react";

interface Props {
  flagId: string;
  currentStatus: string;
}

type Status = "open" | "reviewed" | "dismissed";

export function FlagRowActions({ flagId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function update(newStatus: Status) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const busy = pending || loading;
  if (busy) {
    return (
      <div className="flex items-center gap-1 text-xs text-gem-offwhite/50">
        <Loader2 className="h-3 w-3 animate-spin" />
        Guardando…
      </div>
    );
  }

  if (currentStatus === "open") {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => update("reviewed")}
          className="gap-1 text-xs text-green-400 hover:bg-green-500/10 hover:text-green-300"
        >
          <Check className="h-3.5 w-3.5" />
          Marcar revisado
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => update("dismissed")}
          className="gap-1 text-xs text-gem-offwhite/60 hover:bg-white/5 hover:text-gem-offwhite"
        >
          <XCircle className="h-3.5 w-3.5" />
          Descartar
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => update("open")}
      className="gap-1 text-xs text-gem-offwhite/50 hover:text-gem-offwhite"
    >
      <RotateCcw className="h-3 w-3" />
      Reabrir
    </Button>
  );
}
