"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

export default function ExamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Exams history error:", error?.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <Archive className="h-10 w-10 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-2xl italic text-law-gold">
          Error cargando el historial de exámenes
        </h2>
        <p className="max-w-sm text-sm text-gem-offwhite/60">
          No se pudo obtener el listado. Puede ser un fallo temporal de la base de datos.
        </p>
        {error?.digest && <p className="font-mono text-xs text-gray-600">ID: {error.digest}</p>}
      </div>
      <Button onClick={reset} className="bg-law-accent text-white hover:bg-law-accent/80">
        Reintentar
      </Button>
    </div>
  );
}
