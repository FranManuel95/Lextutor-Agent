"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  currentArea: string;
  currentType: string;
  currentStatus: string;
}

export function ExamsFilters({ currentArea, currentType, currentStatus }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page"); // reset pagination when filter changes
    const qs = params.toString();
    router.push(`/admin/exams${qs ? `?${qs}` : ""}`);
  }

  function clearAll() {
    router.push("/admin/exams");
  }

  const hasAnyFilter = currentArea !== "all" || currentType !== "all" || currentStatus !== "all";

  return (
    <div className="flex flex-wrap items-end gap-3" role="toolbar" aria-label="Filtros de exámenes">
      <div className="w-40">
        <label
          htmlFor="filter-area"
          className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gem-offwhite/50"
        >
          Área
        </label>
        <Select value={currentArea} onValueChange={(v) => setFilter("area", v)}>
          <SelectTrigger
            id="filter-area"
            aria-label="Filtrar por área"
            className="border-law-accent/20 bg-gem-onyx text-gem-offwhite"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-law-accent/20 bg-gem-onyx text-gem-offwhite">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="civil">Civil</SelectItem>
            <SelectItem value="laboral">Laboral</SelectItem>
            <SelectItem value="mercantil">Mercantil</SelectItem>
            <SelectItem value="procesal">Procesal</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <label
          htmlFor="filter-type"
          className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gem-offwhite/50"
        >
          Tipo
        </label>
        <Select value={currentType} onValueChange={(v) => setFilter("type", v)}>
          <SelectTrigger
            id="filter-type"
            aria-label="Filtrar por tipo de examen"
            className="border-law-accent/20 bg-gem-onyx text-gem-offwhite"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-law-accent/20 bg-gem-onyx text-gem-offwhite">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="exam_test">Test</SelectItem>
            <SelectItem value="exam_open">Abierto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <label
          htmlFor="filter-status"
          className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gem-offwhite/50"
        >
          Estado
        </label>
        <Select value={currentStatus} onValueChange={(v) => setFilter("status", v)}>
          <SelectTrigger
            id="filter-status"
            aria-label="Filtrar por estado"
            className="border-law-accent/20 bg-gem-onyx text-gem-offwhite"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-law-accent/20 bg-gem-onyx text-gem-offwhite">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="finished">Finalizado</SelectItem>
            <SelectItem value="in_progress">En curso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasAnyFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="mb-0.5 gap-1.5 text-xs text-gem-offwhite/60 hover:text-gem-offwhite"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
