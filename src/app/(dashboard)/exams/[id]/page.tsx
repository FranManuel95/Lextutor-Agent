'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, BookOpen, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { getExamLevel, getLevelColor } from '@/lib/exams/level'
import { Copyright } from '@/components/copyright'

export default function ExamReviewPage() {
    const params = useParams()
    const router = useRouter()
    const [attempt, setAttempt] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/exams/${params.id}`)
                if (!res.ok) throw new Error('Failed')
                const data = await res.json()
                setAttempt(data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [params.id])

    if (loading) return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 border-4 border-law-gold/30 border-t-law-gold rounded-full animate-spin"></div>
                <h3 className="text-xl font-serif text-slate-300">Cargando revisión...</h3>
            </div>
        </div>
    )
    if (!attempt) return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-8">
            <Card className="bg-[#1E293B] border-red-500/20 max-w-md w-full">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <CardTitle className="text-xl text-slate-200">Examen no encontrado</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-400">
                    <p>No pudimos recuperar los detalles de esta evaluación. Puede que haya sido eliminada.</p>
                    <div className="mt-6">
                        <Button variant="outline" onClick={() => router.push('/exams')} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                            Volver al historial
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    const { type, score, area, created_at, payload } = attempt
    const questions = payload?.questions || []
    const feedback = payload?.attempt || {} // For open exams
    const level = getExamLevel(score || 0)

    // Helper for Quiz Display
    const renderQuizQuestion = (q: any, i: number) => {
        return (
            <div key={i} className="rounded-xl overflow-hidden bg-[#0F172A] border border-slate-800 shadow-sm">
                {/* Header Question */}
                <div className="bg-[#1E293B]/50 p-6 border-b border-slate-800">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-3">
                            {/* Badge pill */}
                            <div className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                                Pregunta {i + 1}
                            </div>
                            <h3 className="text-lg md:text-xl font-serif font-medium leading-relaxed text-slate-100">
                                {q.question}
                            </h3>
                        </div>
                        <div className="text-right shrink-0">
                            {q.isCorrect ? (
                                <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50">Correcta</Badge>
                            ) : (
                                <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50">Incorrecta</Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tu respuesta</label>
                            <div className={`p-4 rounded-md border text-base font-serif ${q.isCorrect ? 'bg-green-950/20 border-green-500/30 text-green-100' : 'bg-red-950/20 border-red-500/30 text-red-100'}`}>
                                {q.userAnswer || <span className="text-slate-500 italic">(Sin respuesta)</span>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-blue-500 uppercase tracking-widest">Respuesta Correcta</label>
                            <div className="p-4 rounded-md bg-blue-950/20 border border-blue-500/30 text-base font-serif text-blue-100">
                                {q.correctAnswer}
                            </div>
                        </div>
                    </div>

                    {q.explanation && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Explicación</label>
                            <div className="text-sm text-slate-300 bg-[#1E293B] p-5 rounded-md border border-slate-700 leading-7">
                                {q.explanation}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Helper for Open Exam Display
    const renderOpenQuestion = (q: any, i: number) => {
        const scoreColor = q.perQuestionScore >= 5 ? 'text-green-500' : 'text-red-500'
        return (
            <div key={i} className="rounded-xl overflow-hidden bg-[#0F172A] border border-slate-800 shadow-sm">
                {/* Header Question */}
                <div className="bg-[#1E293B]/50 p-6 border-b border-slate-800">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-3">
                            {/* Badge pill */}
                            <div className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                                Pregunta {i + 1}
                            </div>
                            <h3 className="text-lg md:text-xl font-serif font-medium leading-relaxed text-slate-100">
                                {q.question}
                            </h3>
                        </div>
                        <div className="text-right shrink-0">
                            <div className={`text-3xl font-bold font-serif ${scoreColor}`}>
                                {q.perQuestionScore}<span className="text-base text-slate-500 font-sans">/10</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">
                                Confianza IA: {Math.round((q.confidence || 0) * 100)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* User Answer */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tu Respuesta</label>
                        <div className="w-full p-4 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-md shadow-sm min-h-[80px] font-medium leading-relaxed font-serif">
                            {q.userAnswer || <span className="text-slate-500 italic">(No contestaste)</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Analysis */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Análisis del Tutor</label>
                                <div className="p-4 bg-[#1E293B] border border-slate-700 rounded-md text-slate-300 text-sm leading-7">
                                    {q.feedback}
                                </div>
                            </div>

                            {/* Missing Points */}
                            {q.missingPoints?.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-red-500 uppercase tracking-wider">
                                        <XCircle className="w-4 h-4" /> Puntos Faltantes
                                    </h4>
                                    <ul className="space-y-2 pl-1">
                                        {q.missingPoints.map((p: string, idx: number) => (
                                            <li key={idx} className="flex gap-2 text-sm text-slate-400 items-start">
                                                <span className="text-red-500/50 mt-1.5 min-w-[4px] h-[4px] bg-red-500 rounded-full"></span>
                                                <span className="leading-relaxed">{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Improvement Tips */}
                            {q.improvementTips?.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-amber-500 uppercase tracking-wider">
                                        <BookOpen className="w-4 h-4" /> Consejos de Mejora
                                    </h4>
                                    <ul className="space-y-2 pl-1">
                                        {q.improvementTips.map((p: string, idx: number) => (
                                            <li key={idx} className="flex gap-2 text-sm text-slate-400 items-start">
                                                <span className="text-amber-500/50 mt-1.5 min-w-[4px] h-[4px] bg-amber-500 rounded-full"></span>
                                                <span className="leading-relaxed">{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Rubric Card */}
                        <div className="bg-[#1E293B] border border-slate-700/50 rounded-lg p-5 shadow-sm h-fit">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Rúbrica</h4>
                            <div className="space-y-5">
                                {q.rubricScores && Object.entries(q.rubricScores).map(([key, val]: any) => {
                                    const maxVal = key === 'accuracy' ? 4 : key === 'reasoning' ? 3 : 2; // Approximate weights
                                    const percentage = (val / maxVal) * 100;

                                    // Dynamic color logic
                                    let indicatorColor = "bg-green-500";
                                    if (percentage < 40) indicatorColor = "bg-red-500";
                                    else if (percentage < 60) indicatorColor = "bg-orange-500";
                                    else if (percentage < 80) indicatorColor = "bg-amber-400";

                                    return (
                                        <div key={key} className="space-y-2">
                                            <div className="flex justify-between text-xs uppercase tracking-wide font-medium text-slate-400">
                                                <span>{key === 'accuracy' ? 'Precisión' : key === 'reasoning' ? 'Razonamiento' : key === 'clarity' ? 'Claridad' : key}</span>
                                                <span className="text-slate-200">{val} Pts</span>
                                            </div>
                                            <Progress value={percentage} className="h-1.5 bg-slate-800" indicatorClassName={indicatorColor} />
                                        </div>
                                    )
                                })}
                                <Separator className="my-4 bg-slate-700" />
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs font-bold uppercase text-slate-400">Total</span>
                                    <span className="text-xl font-bold text-slate-200">{q.perQuestionScore} <span className="text-xs font-normal text-slate-500">/ 10</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            <div className="container mx-auto px-6 md:px-16 py-8 max-w-5xl space-y-10 pb-24">
                {/* Top Bar with Back Button on RIGHT */}
                <div className="flex justify-end pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-white hover:bg-white/5 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver al historial
                    </Button>
                </div>

                {/* Exam Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="text-xs uppercase tracking-widest border-white/20 text-slate-300 px-3 py-1">
                                {attempt.attempt_type === 'quiz' ? 'TEST RÁPIDO' : 'EXAMEN DESARROLLO'}
                            </Badge>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-300 font-medium capitalize">{area}</span>
                            <span className="text-slate-500">• {format(new Date(created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold font-serif text-white tracking-tight">
                            Resultado: {(score || 0).toFixed(1)}
                            <span className="text-2xl text-slate-500 font-sans font-light ml-2">/ 10</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className={`text-base px-6 py-2 font-medium tracking-wide ${getLevelColor(level)}`}>
                            {level}
                        </Badge>
                    </div>
                </div>

                {/* Overall Feedback (Only Open) */}
                {attempt.attempt_type === 'exam_open' && feedback.overallFeedback && (
                    <Card className="border border-indigo-500/20 bg-[#1E293B] shadow-lg overflow-hidden">
                        <div className="p-6 md:p-8">
                            <h3 className="text-xl font-bold text-indigo-300 flex items-center gap-3 mb-6">
                                <CheckCircle2 className="w-6 h-6 text-indigo-400" /> Feedback Global
                            </h3>

                            <p className="text-indigo-200/80 leading-relaxed text-lg font-serif">
                                {feedback.overallFeedback}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-indigo-500/20">
                                {feedback.strengths?.length > 0 && (
                                    <div className="space-y-4">
                                        <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Fortalezas Identificadas</span>
                                        <ul className="space-y-2">
                                            {feedback.strengths.map((s: string, i: number) => (
                                                <li key={i} className="text-sm text-slate-300 flex gap-3 leading-relaxed">
                                                    <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {feedback.weaknesses?.length > 0 && (
                                    <div className="space-y-4">
                                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Debilidades a Trabajar</span>
                                        <ul className="space-y-2">
                                            {feedback.weaknesses.map((s: string, i: number) => (
                                                <li key={i} className="text-sm text-slate-300 flex gap-3 leading-relaxed">
                                                    <span className="text-red-400 shrink-0 mt-1">•</span>
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Questions List */}
                <div className="space-y-8 pt-4">
                    <h3 className="text-2xl font-serif font-bold text-slate-200 border-l-4 border-law-gold pl-4">
                        Detalle de Preguntas
                    </h3>
                    <div className="space-y-12">
                        {questions.map((q: any, i: number) => (
                            attempt.attempt_type === 'quiz' ? renderQuizQuestion(q, i) : renderOpenQuestion(q, i)
                        ))}
                    </div>
                </div>
            </div>

            {/* Global Footer */}
            <footer className="w-full bg-[#020617] border-t border-white/5 py-8 mt-12">
                <Copyright className="text-slate-600" />
            </footer>
        </div>
    )
}
