"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  area?: string;
  type?: string;
  status?: string;
}

function buildHref(page: number, area?: string, type?: string, status?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (area) params.set("area", area);
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  const qs = params.toString();
  return `/admin/exams${qs ? `?${qs}` : ""}`;
}

export function ExamsPagination({ currentPage, totalPages, area, type, status }: Props) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between border-t border-law-accent/10 pt-4">
      <p className="text-xs text-gem-offwhite/50">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          className="border-law-accent/20 bg-gem-slate text-gem-offwhite hover:bg-white/5 disabled:opacity-30"
        >
          <Link href={hasPrev ? buildHref(currentPage - 1, area, type, status) : "#"}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={!hasNext}
          className="border-law-accent/20 bg-gem-slate text-gem-offwhite hover:bg-white/5 disabled:opacity-30"
        >
          <Link href={hasNext ? buildHref(currentPage + 1, area, type, status) : "#"}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
