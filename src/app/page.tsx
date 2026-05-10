import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Landmark,
  BarChart3,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Copyright } from "@/components/copyright";
import { MobileNav } from "@/components/mobile-nav";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gem-onyx font-sans text-gem-offwhite selection:bg-law-gold selection:text-gem-onyx">
      {/* Navigation */}
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-gem-border/40 bg-gem-onyx/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <MobileNav />
              <div className="flex-shrink-0">
                <span className="font-serif text-2xl italic text-gem-offwhite">
                  LexTutor <span className="text-law-gold">Agent</span>
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link
                  href="#"
                  className="text-sm font-medium uppercase tracking-widest text-gem-offwhite/80 transition-colors hover:text-law-gold"
                >
                  Características
                </Link>
                <Link
                  href="#"
                  className="text-sm font-medium uppercase tracking-widest text-gem-offwhite/80 transition-colors hover:text-law-gold"
                >
                  Sobre Nosotros
                </Link>
                <Link
                  href="#"
                  className="text-sm font-medium uppercase tracking-widest text-gem-offwhite/80 transition-colors hover:text-law-gold"
                >
                  Seguridad
                </Link>
                <Link
                  href="#"
                  className="text-sm font-medium uppercase tracking-widest text-gem-offwhite/80 transition-colors hover:text-law-gold"
                >
                  Contacto
                </Link>
              </div>
            </div>
            <div>
              <Link href="/login" className="hidden md:block">
                <Button className="bg-law-gold px-6 font-bold uppercase tracking-wide text-gem-onyx hover:bg-law-gold/90">
                  Empezar ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 pb-4 pt-32 text-center sm:pb-16 sm:pt-40">
        <h1 className="mb-6 font-serif text-5xl font-bold tracking-tight text-gem-offwhite md:text-7xl lg:text-8xl">
          El Estándar de <span className="italic text-law-gold">Oro</span> en IA
          <br className="hidden md:block" /> Jurídica.
        </h1>
        <p className="mb-8 mt-8 max-w-2xl text-lg font-light tracking-wide text-gem-offwhite/80 md:text-xl">
          Lleva tu conocimiento de derecho a otro nivel.
        </p>
      </main>

      {/* Middle Section: Top Features (Chat, Exams, Progress) */}
      <section className="border-y border-gem-border/40 bg-gem-slate py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {/* Feature 1: Chat */}
            <div className="group rounded-3xl border border-law-accent/30 bg-gem-mist p-8 transition-all duration-300 hover:-translate-y-1 hover:border-law-gold/50">
              <div className="mb-6 flex justify-center">
                <MessageSquare className="h-12 w-12 text-law-gold" />
              </div>
              <h3 className="mb-3 text-center font-serif text-xl font-bold italic text-gem-offwhite transition-colors group-hover:text-law-gold">
                Tutor IA Personalizado
              </h3>
              <p className="text-center text-sm leading-relaxed text-gem-offwhite/60">
                Interactúa con un agente jurídico experto que responde basándose exclusivamente en
                tus manuales y documentos subidos. Sin alucinaciones.
              </p>
            </div>

            {/* Feature 2: Exams */}
            <div className="group rounded-3xl border border-law-accent/30 bg-gem-mist p-8 transition-all duration-300 hover:-translate-y-1 hover:border-law-gold/50">
              <div className="mb-6 flex justify-center">
                <GraduationCap className="h-12 w-12 text-law-gold" />
              </div>
              <h3 className="mb-3 text-center font-serif text-xl font-bold italic text-gem-offwhite transition-colors group-hover:text-law-gold">
                Evaluación Continua
              </h3>
              <p className="text-center text-sm leading-relaxed text-gem-offwhite/60">
                Genera exámenes tipo test y de desarrollo. Recibe correcciones instantáneas con
                feedback detallado y fundamentación jurídica.
              </p>
            </div>

            {/* Feature 3: Progress */}
            <div className="group rounded-3xl border border-law-accent/30 bg-gem-mist p-8 transition-all duration-300 hover:-translate-y-1 hover:border-law-gold/50">
              <div className="mb-6 flex justify-center">
                <TrendingUp className="h-12 w-12 text-law-gold" />
              </div>
              <h3 className="mb-3 text-center font-serif text-xl font-bold italic text-gem-offwhite transition-colors group-hover:text-law-gold">
                Control de Progreso
              </h3>
              <p className="text-center text-sm leading-relaxed text-gem-offwhite/60">
                Monitoriza tu evolución académica. Visualiza tus estadísticas, detecta áreas débiles
                y optimiza tu estrategia de estudio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gem-slate/30 py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-3xl border border-law-accent/30 bg-gem-mist p-8 transition-all duration-300 hover:-translate-y-1 hover:border-law-gold/50">
              <div className="mb-6 flex justify-center">
                <Zap className="h-12 w-12 text-law-gold" />
              </div>
              <h3 className="mb-3 text-center font-serif text-xl font-bold italic text-gem-offwhite transition-colors group-hover:text-law-gold">
                Speed Fast
              </h3>
              <p className="text-center text-sm leading-relaxed text-gem-offwhite/60">
                Procesamiento de 15MB de manuales en menos de 2 segundos mediante IA.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl border border-law-accent/30 bg-gem-mist p-8 transition-all duration-300 hover:-translate-y-1 hover:border-law-gold/50">
              <div className="mb-6 flex justify-center">
                <Landmark className="h-12 w-12 text-law-gold" />
              </div>
              <h3 className="mb-3 text-center font-serif text-xl font-bold italic text-gem-offwhite transition-colors group-hover:text-law-gold">
                Cero Alucinación
              </h3>
              <p className="text-center text-sm leading-relaxed text-gem-offwhite/60">
                Respuestas ancladas exclusivamente en la biblioteca digitalizada por tu
                administrador.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl border border-law-accent/30 bg-gem-mist p-8 transition-all duration-300 hover:-translate-y-1 hover:border-law-gold/50">
              <div className="mb-6 flex justify-center">
                <BarChart3 className="h-12 w-12 text-law-gold" />
              </div>
              <h3 className="mb-3 text-center font-serif text-xl font-bold italic text-gem-offwhite transition-colors group-hover:text-law-gold">
                Visual Engine
              </h3>
              <p className="text-center text-sm leading-relaxed text-gem-offwhite/60">
                Generación automática de pirámides normativas y flujogramas procesales dinámicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Snippet */}
      <footer className="w-full bg-gem-onyx">
        <Copyright />
      </footer>
    </div>
  );
}
