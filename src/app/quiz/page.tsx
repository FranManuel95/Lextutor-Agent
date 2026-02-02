'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function QuizPage() {
    const [step, setStep] = useState<'config' | 'taking' | 'results'>('config')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    // Config
    const [config, setConfig] = useState({
        area: 'civil',
        difficulty: 'medium',
        count: 15
    })

    // Quiz Data
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [answers, setAnswers] = useState<Record<string, number>>({}) // questionId -> selectedIndex
    const [usesRag, setUsesRag] = useState(false)
    const [sources, setSources] = useState<string[]>([])

    // Results
    const [result, setResult] = useState<any>(null)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setSessionId(data.sessionId)
            setQuestions(data.questions)
            setUsesRag(data.ragUsed || false)
            setSources(data.sources || [])

            if (data.ragUsed) {
                toast({ title: 'RAG Activo', description: 'Test generado con tus documentos.', className: 'bg-green-500/10 border-green-500/50 text-green-200' })
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
            const res = await fetch('/api/quiz/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    answers
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setResult(data)
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
                <div className="flex items-center justify-between mb-8 flex-none">
                    <h1 className="text-3xl font-serif italic text-white">
                        Evaluación <span className="text-law-gold">Tipo Test</span>
                    </h1>
                </div>

                {step === 'config' && (
                    <Card className="bg-gem-mist/10 border-law-accent/20">
                        <CardHeader>
                            <CardTitle className="text-white">Configurar Test</CardTitle>
                            <CardDescription>Practica con preguntas tipo test generadas por IA y corregidas al instante.</CardDescription>
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
                                        <SelectItem value="10">10 Preguntas</SelectItem>
                                        <SelectItem value="15">15 Preguntas</SelectItem>
                                        <SelectItem value="20">20 Preguntas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generar Test
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'taking' && (
                    <div className="space-y-8 pb-10">
                        <div className="flex justify-between items-center bg-gem-mist/10 p-4 rounded-lg border border-white/5">
                            <h2 className="text-xl font-serif text-law-gold">Responde las preguntas</h2>
                            {usesRag && (
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex flex-wrap justify-end gap-2 max-w-md">
                                        {sources.length > 0 ? (
                                            sources.map((source, idx) => (
                                                <Badge key={idx} variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 gap-2 w-fit">
                                                    <CheckCircle2 size={12} />Documento: {source}
                                                </Badge>
                                            ))
                                        ) : (
                                            <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10 gap-2 w-fit">
                                                <CheckCircle2 size={14} /> Fuente: Documentos
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {questions.map((q, index) => (
                            <Card key={q.id} className="bg-gem-mist/10 border-law-accent/10">
                                <CardHeader>
                                    <CardTitle className="text-lg text-law-gold font-serif">Pregunta {index + 1}</CardTitle>
                                    <CardDescription className="text-white text-base mt-2">{q.text}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={answers[String(q.id)]?.toString()}
                                        onValueChange={(v) => setAnswers({ ...answers, [String(q.id)]: Number(v) })}
                                        className="space-y-3"
                                    >
                                        {q.options.map((opt: string, i: number) => (
                                            <div key={i} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer">
                                                <RadioGroupItem value={String(i)} id={`q${q.id}-opt${i}`} className="border-law-gold text-law-gold" />
                                                <Label htmlFor={`q${q.id}-opt${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        ))}

                        <div className="sticky bottom-4 bg-gem-onyx/90 backdrop-blur p-4 border-t border-law-accent/20 rounded-t-xl flex justify-between items-center z-20">
                            <span className="text-sm text-gray-400">
                                {Object.keys(answers).length} / {questions.length} respondidas
                            </span>
                            <Button onClick={handleSubmit} disabled={loading} className="bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold">
                                {loading ? "Corrigiendo..." : "Corregir Test"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'results' && result && (
                    <div className="space-y-6 pb-10">
                        <Card className="bg-gem-mist/10 border-law-accent/20">
                            <div className="flex justify-center py-6">
                                <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-law-gold bg-law-gold/10">
                                    <div className="text-center">
                                        <span className="text-3xl font-bold text-white">{result.percentage}%</span>
                                        <p className="text-xs uppercase text-law-gold font-bold">{result.score}/{result.total}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            {result.grading.map((item: any) => {
                                // API returns { id, question, userAnswer, correctAnswer, isCorrect, explanation }
                                // We don't need to look up in 'questions' array because API returns the text.
                                return (
                                    <Card key={item.id} className={cn("border", item.isCorrect ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5")}>
                                        <CardHeader>
                                            <div className="flex gap-3">
                                                {item.isCorrect ? <CheckCircle2 className="text-green-500 mt-1" /> : <XCircle className="text-red-500 mt-1" />}
                                                <div>
                                                    <CardTitle className="text-base text-gray-200">{item.question}</CardTitle>
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-sm">
                                                            <span className={item.isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>Tu respuesta:</span> {item.userAnswer || "Sin respuesta"}
                                                        </p>
                                                        {!item.isCorrect && (
                                                            <p className="text-sm text-green-400">
                                                                <span className="font-bold">Correcta:</span> {item.correctAnswer}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="bg-black/20 p-3 rounded text-sm text-gray-400 mt-2">
                                                <span className="font-bold text-gray-500 uppercase text-xs">Explicación:</span> {item.explanation}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        <Button
                            onClick={() => { setStep('config'); setAnswers({}); setResult(null); }}
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5 text-white"
                        >
                            Nuevo Test
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
