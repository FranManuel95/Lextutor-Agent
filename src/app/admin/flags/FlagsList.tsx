"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { FlagRowActions } from "./FlagRowActions";

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

const REASON_LABEL: Record<string, string> = {
  incorrect: "Respuesta incorrecta",
  ambiguous: "Ambigua",
  off_topic: "Fuera de tema",
  other: "Otro",
};

interface Props {
  flags: Flag[];
  profilesById: Record<string, string>;
  currentStatus: string;
}

export function FlagsList({ flags, profilesById, currentStatus }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [bulkLoading, setBulkLoading] = useState(false);

  const allSelected = flags.length > 0 && selected.size === flags.length;
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(flags.map((f) => f.id)));
  }

  async function bulkUpdate(newStatus: "reviewed" | "dismissed" | "open") {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/flags/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: newStatus }),
      });
      if (!res.ok) throw new Error("Bulk update failed");
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
    } finally {
      setBulkLoading(false);
    }
  }

  if (flags.length === 0) {
    return (
      <p className="py-8 text-center italic text-gem-offwhite/40">
        No hay reportes en este estado.
      </p>
    );
  }

  const busy = pending || bulkLoading;

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      <div className="flex flex-col gap-2 rounded-lg border border-law-accent/10 bg-black/10 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gem-offwhite/60">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            className="border-law-accent/40 data-[state=checked]:bg-law-gold data-[state=checked]:text-gem-onyx"
          />
          {someSelected
            ? `${selected.size} seleccionado${selected.size !== 1 ? "s" : ""}`
            : "Seleccionar todo"}
        </label>

        {someSelected && (
          <div className="flex gap-1">
            {currentStatus === "open" ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => bulkUpdate("reviewed")}
                  disabled={busy}
                  className="gap-1 text-xs text-green-400 hover:bg-green-500/10 hover:text-green-300"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Marcar revisados
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => bulkUpdate("dismissed")}
                  disabled={busy}
                  className="gap-1 text-xs text-gem-offwhite/60 hover:bg-white/5 hover:text-gem-offwhite"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  Descartar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => bulkUpdate("open")}
                disabled={busy}
                className="gap-1 text-xs text-gem-offwhite/60 hover:bg-white/5 hover:text-gem-offwhite"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                Reabrir
              </Button>
            )}
          </div>
        )}
      </div>

      {flags.map((f) => {
        const isChecked = selected.has(f.id);
        return (
          <div
            key={f.id}
            className={`space-y-3 rounded-lg border p-4 transition ${
              isChecked ? "border-law-gold/40 bg-law-gold/5" : "border-law-accent/10 bg-black/20"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(f.id)}
                  className="border-law-accent/40 data-[state=checked]:bg-law-gold data-[state=checked]:text-gem-onyx"
                />
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
              <p className="text-sm italic text-gem-offwhite">&ldquo;{f.question_text}&rdquo;</p>
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
        );
      })}
    </div>
  );
}
