import Link from "next/link";
import { Scale } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gem-onyx px-4 text-gem-offwhite">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Scale className="h-16 w-16 text-law-gold/40" />
        </div>

        <p className="mb-2 font-mono text-6xl font-bold text-law-gold/60">404</p>
        <h1 className="mb-3 font-serif text-2xl italic text-gem-offwhite">Página no encontrada</h1>
        <p className="mb-8 max-w-sm text-sm text-gem-offwhite/50">
          La página que buscas no existe o ha sido movida. Vuelve al inicio para continuar
          estudiando.
        </p>

        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-lg border border-law-gold/30 bg-law-gold/10 px-5 py-2.5 text-sm font-semibold text-law-gold transition hover:bg-law-gold/20"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
