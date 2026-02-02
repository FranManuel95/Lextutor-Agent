import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, Landmark, BarChart3, MessageSquare, GraduationCap, TrendingUp, ArrowRight } from 'lucide-react'
import { Copyright } from '@/components/copyright'
import { MobileNav } from '@/components/mobile-nav'

export default function Home() {
    return (
        <div className="min-h-screen bg-gem-onyx text-gem-offwhite font-sans selection:bg-law-gold selection:text-gem-onyx overflow-x-hidden">

            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-gem-onyx/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-4">
                            <MobileNav />
                            <div className="flex-shrink-0">
                                <span className="font-serif italic text-2xl text-white">
                                    LexTutor <span className="text-law-gold">Agent</span>
                                </span>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">
                                <Link href="#" className="text-sm font-medium hover:text-law-gold transition-colors text-gem-offwhite/80 uppercase tracking-widest">Características</Link>
                                <Link href="#" className="text-sm font-medium hover:text-law-gold transition-colors text-gem-offwhite/80 uppercase tracking-widest">Sobre Nosotros</Link>
                                <Link href="#" className="text-sm font-medium hover:text-law-gold transition-colors text-gem-offwhite/80 uppercase tracking-widest">Seguridad</Link>
                                <Link href="#" className="text-sm font-medium hover:text-law-gold transition-colors text-gem-offwhite/80 uppercase tracking-widest">Contacto</Link>
                            </div>
                        </div>
                        <div>
                            <Link href="/login" className="hidden md:block">
                                <Button className="bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold tracking-wide uppercase px-6">
                                    Empezar ahora
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-4 sm:pt-40 sm:pb-16 flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-white mb-6">
                    El Estándar de <span className="text-law-gold italic">Oro</span> en IA
                    <br className="hidden md:block" /> Jurídica.
                </h1>
                <p className="text-lg md:text-xl text-gem-offwhite/80 max-w-2xl font-light tracking-wide mt-8 mb-8">
                    Lleva tu conocimiento de derecho a otro nivel.
                </p>
            </main>

            {/* Middle Section: Top Features (Chat, Exams, Progress) */}
            <section className="py-10 md:py-20 bg-gem-slate/20 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {/* Feature 1: Chat */}
                        <div className="p-8 rounded-3xl bg-gem-mist/40 border border-law-accent/30 hover:border-law-gold/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="flex justify-center mb-6">
                                <MessageSquare className="text-law-gold w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-center text-white mb-3 italic group-hover:text-law-gold transition-colors">
                                Tutor IA Personalizado
                            </h3>
                            <p className="text-center text-gem-offwhite/60 text-sm leading-relaxed">
                                Interactúa con un agente jurídico experto que responde basándose exclusivamente en tus manuales y documentos subidos. Sin alucinaciones.
                            </p>
                        </div>

                        {/* Feature 2: Exams */}
                        <div className="p-8 rounded-3xl bg-gem-mist/40 border border-law-accent/30 hover:border-law-gold/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="flex justify-center mb-6">
                                <GraduationCap className="text-law-gold w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-center text-white mb-3 italic group-hover:text-law-gold transition-colors">
                                Evaluación Continua
                            </h3>
                            <p className="text-center text-gem-offwhite/60 text-sm leading-relaxed">
                                Genera exámenes tipo test y de desarrollo. Recibe correcciones instantáneas con feedback detallado y fundamentación jurídica.
                            </p>
                        </div>

                        {/* Feature 3: Progress */}
                        <div className="p-8 rounded-3xl bg-gem-mist/40 border border-law-accent/30 hover:border-law-gold/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="flex justify-center mb-6">
                                <TrendingUp className="text-law-gold w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-center text-white mb-3 italic group-hover:text-law-gold transition-colors">
                                Control de Progreso
                            </h3>
                            <p className="text-center text-gem-offwhite/60 text-sm leading-relaxed">
                                Monitoriza tu evolución académica. Visualiza tus estadísticas, detecta áreas débiles y optimiza tu estrategia de estudio.
                            </p>
                        </div>
                    </div>


                </div>
            </section>



            {/* Features Grid */}
            <section className="py-10 md:py-20 bg-gem-slate/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-3xl bg-gem-mist/40 border border-law-accent/30 hover:border-law-gold/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="flex justify-center mb-6">
                                <Zap className="text-law-gold w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-center text-white mb-3 italic group-hover:text-law-gold transition-colors">
                                Speed Fast
                            </h3>
                            <p className="text-center text-gem-offwhite/60 text-sm leading-relaxed">
                                Procesamiento de 15MB de manuales en menos de 2 segundos mediante IA.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-3xl bg-gem-mist/40 border border-law-accent/30 hover:border-law-gold/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="flex justify-center mb-6">
                                <Landmark className="text-law-gold w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-center text-white mb-3 italic group-hover:text-law-gold transition-colors">
                                Cero Alucinación
                            </h3>
                            <p className="text-center text-gem-offwhite/60 text-sm leading-relaxed">
                                Respuestas ancladas exclusivamente en la biblioteca digitalizada por tu administrador.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-3xl bg-gem-mist/40 border border-law-accent/30 hover:border-law-gold/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="flex justify-center mb-6">
                                <BarChart3 className="text-law-gold w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-center text-white mb-3 italic group-hover:text-law-gold transition-colors">
                                Visual Engine
                            </h3>
                            <p className="text-center text-gem-offwhite/60 text-sm leading-relaxed">
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
