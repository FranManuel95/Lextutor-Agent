"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function ExamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Exam error:", error?.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <FileText className="h-10 w-10 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-2xl italic text-law-gold">Error en el examen</h2>
        <p className="max-w-sm text-sm text-gem-offwhite/60">
          No se pudo cargar el examen. Si estabas respondiendo, tus respuestas podrían no haberse
          guardado. Intenta de nuevo.
        </p>
        {error?.digest && <p className="font-mono text-xs text-gray-600">ID: {error.digest}</p>}
      </div>
      <Button onClick={reset} className="bg-law-accent text-white hover:bg-law-accent/80">
        Reintentar
      </Button>
    </div>
  );
}
