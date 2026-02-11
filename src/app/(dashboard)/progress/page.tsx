import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy, Target, TrendingUp, BookOpen, Clock, Activity } from 'lucide-react'
import { Copyright } from '@/components/copyright'

export default async function ProgressPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Stats in Parallel
    const [answersRes, eventsRes] = await Promise.all([
        supabase
            .from('student_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('kind', 'answer_submitted'),
        supabase
            .from('student_events')
            .select('area, kind')
            .eq('user_id', user.id)
            .eq('kind', 'answer_submitted')
            .order('created_at', { ascending: false })
            .limit(1000)
    ])

    const totalAnswers = answersRes.count
    const events = eventsRes.data

    const distribution: Record<string, number> = {}
        ; (events as any[])?.forEach(e => {
            const area = e.area || 'General'
            distribution[area] = (distribution[area] || 0) + 1
        })

    // 3. Milestones (Mock logic for MVP display based on counts)
    const milestones = [
        { id: 1, title: 'Iniciado', desc: 'Primera pregunta realizada', unlocked: (totalAnswers || 0) >= 1, icon: BookOpen },
        { id: 2, title: 'Estudiante', desc: '10 preguntas completadas', unlocked: (totalAnswers || 0) >= 10, icon: Target },
        { id: 3, title: 'Experto', desc: '50 preguntas completadas', unlocked: (totalAnswers || 0) >= 50, icon: Trophy },
        { id: 4, title: 'Elite', desc: '100 preguntas completadas', unlocked: (totalAnswers || 0) >= 100, icon: TrendingUp },
    ]

    return (
        <div className="h-full w-full bg-gem-onyx text-gem-offwhite font-sans flex flex-col overflow-hidden">
            <div className="flex-none border-b border-white/5 bg-[#020617]/50 backdrop-blur-sm z-10 px-6 md:px-10">
                <div className="max-w-6xl mx-auto flex justify-between items-center py-6 md:pt-8 md:pb-4">
                    <h1 className="text-3xl font-serif italic text-white text-shadow-sm">Mi Progreso</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-3 py-6 px-6 md:px-16">
                <div className="max-w-6xl mx-auto space-y-8 pb-10">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gem-mist/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-law-gold/30 transition-all shadow-lg shadow-black/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Activity size={80} />
                            </div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Total Preguntas</h3>
                            <p className="text-5xl font-mono text-white font-bold tracking-tight">{totalAnswers || 0}</p>
                        </div>

                        <div className="bg-gem-mist/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-law-gold/30 transition-all shadow-lg shadow-black/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Clock size={80} />
                            </div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Racha Actual</h3>
                            <p className="text-5xl font-mono text-law-gold font-bold tracking-tight">0 <span className="text-lg text-gray-500 font-sans font-medium">días</span></p>
                            <p className="text-xs text-gray-500 mt-2 font-medium">¡Sigue practicando!</p>
                        </div>

                        <div className="bg-gem-mist/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-law-gold/30 transition-all shadow-lg shadow-black/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BookOpen size={80} />
                            </div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Área Principal</h3>
                            <p className="text-3xl font-serif italic text-white font-bold capitalize truncate">
                                {Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Tu materia más estudiada</p>
                        </div>
                    </div>

                    {/* Distribution & Milestones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Distribution List */}
                        <div className="bg-gray-900/40 rounded-2xl p-6 border border-white/5 shadow-inner">
                            <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                                <Target size={20} className="text-law-gold" />
                                Distribución por Materia
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(distribution).length === 0 ? (
                                    <p className="text-gray-500 text-sm italic">Aún no hay datos registrados.</p>
                                ) : (
                                    Object.entries(distribution).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
                                        <div key={area} className="group">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="capitalize text-gray-200 group-hover:text-law-gold transition-colors font-medium">{area}</span>
                                                <span className="font-mono text-white font-bold">{count}</span>
                                            </div>
                                            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-gradient-to-r from-law-gold to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all duration-500 rounded-full"
                                                    style={{ width: `${(count / (totalAnswers || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Milestones */}
                        <div className="bg-gray-900/40 rounded-2xl p-6 border border-white/5 shadow-inner">
                            <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                                <Trophy size={20} className="text-law-gold" />
                                Hitos Desbloqueados
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {milestones.map((m) => {
                                    const Icon = m.icon
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${m.unlocked
                                                ? 'bg-law-gold/5 border-law-gold/30 hover:bg-law-gold/10'
                                                : 'bg-black/20 border-white/5 opacity-50 grayscale'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-full flex-shrink-0 ${m.unlocked ? 'bg-law-gold text-gem-onyx shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-800 text-gray-500'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className={`font-bold text-sm ${m.unlocked ? 'text-white' : 'text-gray-400'}`}>{m.title}</h4>
                                                <p className="text-xs text-gray-500 truncate">{m.desc}</p>
                                            </div>
                                            {m.unlocked && (
                                                <div className="ml-auto text-law-gold font-bold text-[10px] uppercase tracking-widest border border-law-gold/50 px-2 py-1 rounded bg-law-gold/5">
                                                    Hecho
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    )
}
