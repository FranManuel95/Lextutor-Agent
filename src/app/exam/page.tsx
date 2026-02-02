'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Copyright } from '@/components/copyright'

export default function ExamPage() {
    const [step, setStep] = useState<'config' | 'taking' | 'results'>('config')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    // Config
    const [config, setConfig] = useState({
        area: 'civil',
        difficulty: 'medium',
        count: 10
    })

    // Exam Data
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [usesRag, setUsesRag] = useState(false)

    // Results
    const [grading, setGrading] = useState<any>(null)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/exam/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setSessionId(data.sessionId)
            setQuestions(data.questions)
            setUsesRag(data.ragUsed || false)

            if (data.ragUsed) {
                toast({ title: 'RAG Activo', description: 'Examen generado con tus documentos.', className: 'bg-green-500/10 border-green-500/50 text-green-200' })
            }

            setStep('taking')
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!sessionId) return
        setLoading(true)
        try {
            const res = await fetch('/api/exam/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    answers
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setGrading(data)
            setStep('results')
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-full w-full bg-gem-onyx text-gem-offwhite font-sans flex flex-col overflow-hidden p-8">
            <div className="max-w-4xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar pr-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 flex-none">
                    <h1 className="text-3xl font-serif italic text-white">
                        Evaluación <span className="text-law-gold">Desarrollo</span>
                    </h1>
                </div>

                {step === 'config' && (
                    <Card className="bg-gem-mist/10 border-law-accent/20">
                        <CardHeader>
                            <CardTitle className="text-white">Configurar Examen</CardTitle>
                            <CardDescription>Genera preguntas de desarrollo para practicar tu argumentación jurídica.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Área</Label>
                                <Select value={config.area} onValueChange={(v) => setConfig({ ...config, area: v })}>
                                    <SelectTrigger className="bg-gem-onyx border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gem-onyx border-law-accent/20 text-white">
                                        <SelectItem value="laboral">Laboral</SelectItem>
                                        <SelectItem value="civil">Civil</SelectItem>
                                        <SelectItem value="mercantil">Mercantil</SelectItem>
                                        <SelectItem value="procesal">Procesal</SelectItem>
                                        <SelectItem value="otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Dificultad</Label>
                                <Select value={config.difficulty} onValueChange={(v) => setConfig({ ...config, difficulty: v })}>
                                    <SelectTrigger className="bg-gem-onyx border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gem-onyx border-law-accent/20 text-white">
                                        <SelectItem value="easy">Fácil</SelectItem>
                                        <SelectItem value="medium">Media</SelectItem>
                                        <SelectItem value="hard">Difícil</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Número de preguntas</Label>
                                <Select value={String(config.count)} onValueChange={(v) => setConfig({ ...config, count: Number(v) })}>
                                    <SelectTrigger className="bg-gem-onyx border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gem-onyx border-law-accent/20 text-white">
                                        <SelectItem value="5">5 Preguntas</SelectItem>
                                        <SelectItem value="10">10 Preguntas</SelectItem>
                                        <SelectItem value="15">15 Preguntas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generar Examen
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'taking' && (
                    <div className="space-y-8 pb-10">
                        <div className="flex justify-between items-center bg-gem-mist/10 p-4 rounded-lg border border-white/5">
                            <h2 className="text-xl font-serif text-law-gold">Responde las preguntas</h2>
                            {usesRag && (
                                <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 gap-2">
                                    <CheckCircle2 size={14} /> Fuente: Documentos
                                </Badge>
                            )}
                        </div>
                        {questions.map((q, index) => (
                            <Card key={q.id} className="bg-gem-mist/10 border-law-accent/10">
                                <CardHeader>
                                    <CardTitle className="text-lg text-law-gold font-serif">Pregunta {index + 1}</CardTitle>
                                    <CardDescription className="text-white text-base mt-2">{q.text}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={answers[String(q.id)] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [String(q.id)]: e.target.value })}
                                        placeholder="Escribe tu respuesta aquí..."
                                        className="min-h-[150px] bg-gem-onyx/50 border-white/10 text-white resize-y"
                                    />
                                </CardContent>
                            </Card>
                        ))}

                        <div className="sticky bottom-4 bg-gem-onyx/90 backdrop-blur p-4 border-t border-law-accent/20 rounded-t-xl flex justify-between items-center z-20">
                            <span className="text-sm text-gray-400">
                                {Object.keys(answers).length} / {questions.length} respondidas
                            </span>
                            <Button onClick={handleSubmit} disabled={loading} className="bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold">
                                {loading ? "Corrigiendo..." : "Entregar Examen"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'results' && grading && (
                    <div className="space-y-6 pb-10">
                        <Card className="bg-gem-mist/10 border-law-accent/20">
                            <CardHeader>
                                <CardTitle className="text-3xl text-law-gold text-center">{grading.attempt?.finalScore || 0}/10</CardTitle>
                                <CardDescription className="text-center text-lg text-white">Nota Final</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                                    <h4 className="flex items-center gap-2 text-red-300 font-bold mb-2">
                                        <AlertTriangle size={18} /> Feedback General
                                    </h4>
                                    <p className="text-sm text-gray-300 italic">{grading.attempt?.overallFeedback}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {(grading.questions || []).map((item: any, index: number) => {
                                // Match question by index since ID might be missing in result or different structure
                                const question = questions[index] || { text: 'Pregunta desconocida' }
                                const userAnswer = answers[String(question.id)]

                                return (
                                    <Card key={index} className="bg-gem-mist/5 border-white/5">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base text-gray-300">
                                                    Pregunta: {question.text}
                                                </CardTitle>
                                                <Badge className={item.perQuestionScore >= 5 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                                                    {item.perQuestionScore}/10
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            <div>
                                                <p className="font-bold text-gray-500 text-xs uppercase mb-1">Tu Respuesta</p>
                                                <p className="text-white/80 p-3 bg-black/20 rounded">{userAnswer || <span className='text-gray-600 italic'>Sin respuesta</span>}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-law-gold text-xs uppercase mb-1">Feedback</p>
                                                <p className="text-gray-300">{item.feedback}</p>
                                            </div>

                                            {item.improvementTips && item.improvementTips.length > 0 && (
                                                <div>
                                                    <p className="font-bold text-blue-400 text-xs uppercase mb-1">Tips de Mejora</p>
                                                    <ul className="list-disc list-inside text-gray-400">
                                                        {item.improvementTips.map((tip: string, i: number) => (
                                                            <li key={i}>{tip}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        <Button
                            onClick={() => { setStep('config'); setAnswers({}); setGrading(null); }}
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5 text-white"
                        >
                            Nuevo Examen
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
