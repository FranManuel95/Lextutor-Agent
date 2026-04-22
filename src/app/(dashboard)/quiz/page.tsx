"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VALID_AREAS = ["laboral", "civil", "mercantil", "procesal", "otro"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

export default function QuizPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"config" | "taking" | "results">("config");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Config — hydrated from URL search params (enables "retry" deep-links)
  const urlArea = searchParams?.get("area");
  const urlDifficulty = searchParams?.get("difficulty");
  const urlCount = parseInt(searchParams?.get("count") ?? "", 10);

  const [config, setConfig] = useState({
    area: urlArea && VALID_AREAS.includes(urlArea) ? urlArea : "civil",
    difficulty:
      urlDifficulty && VALID_DIFFICULTIES.includes(urlDifficulty) ? urlDifficulty : "medium",
    count: Number.isFinite(urlCount) ? Math.min(20, Math.max(5, urlCount)) : 15,
  });

  // Quiz Data
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // questionId -> selectedIndex
  const [usesRag, setUsesRag] = useState(false);
  const [sources, setSources] = useState<string[]>([]);

  // Results
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setUsesRag(data.ragUsed || false);
      setSources(data.sources || []);

      if (data.ragUsed) {
        toast({
          title: "RAG Activo",
          description: "Test generado con tus documentos.",
          className: "bg-green-500/10 border-green-500/50 text-green-200",
        });
      }

      setStep("taking");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setStep("results");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx p-8 font-sans text-gem-offwhite">
      <div className="custom-scrollbar mx-auto w-full max-w-4xl flex-1 overflow-y-auto pr-4">
        <div className="mb-8 flex flex-none items-center justify-between">
          <h1 className="font-serif text-3xl italic text-white">
            Evaluación <span className="text-law-gold">Tipo Test</span>
          </h1>
        </div>

        {step === "config" && (
          <Card className="border-law-accent/20 bg-gem-mist/10">
            <CardHeader>
              <CardTitle className="text-white">Configurar Test</CardTitle>
              <CardDescription>
                Practica con preguntas tipo test generadas por IA y corregidas al instante.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Área</Label>
                <Select
                  value={config.area}
                  onValueChange={(v) => setConfig({ ...config, area: v })}
                >
                  <SelectTrigger className="border-white/10 bg-gem-onyx text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-law-accent/20 bg-gem-onyx text-white">
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
                <Select
                  value={config.difficulty}
                  onValueChange={(v) => setConfig({ ...config, difficulty: v })}
                >
                  <SelectTrigger className="border-white/10 bg-gem-onyx text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-law-accent/20 bg-gem-onyx text-white">
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número de preguntas</Label>
                <Select
                  value={String(config.count)}
                  onValueChange={(v) => setConfig({ ...config, count: Number(v) })}
                >
                  <SelectTrigger className="border-white/10 bg-gem-onyx text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-law-accent/20 bg-gem-onyx text-white">
                    <SelectItem value="10">10 Preguntas</SelectItem>
                    <SelectItem value="15">15 Preguntas</SelectItem>
                    <SelectItem value="20">20 Preguntas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-law-gold font-bold text-gem-onyx hover:bg-law-gold/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Test
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "taking" && (
          <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-gem-mist/10 p-4">
              <h2 className="font-serif text-xl text-law-gold">Responde las preguntas</h2>
              {usesRag && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex max-w-md flex-wrap justify-end gap-2">
                    {sources.length > 0 ? (
                      sources.map((source, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="w-fit gap-2 border-green-500/50 bg-green-500/10 text-green-400"
                        >
                          <CheckCircle2 size={12} />
                          Documento: {source}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        variant="outline"
                        className="w-fit gap-2 border-green-500/50 bg-green-500/10 text-green-400"
                      >
                        <CheckCircle2 size={14} /> Fuente: Documentos
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            {questions.map((q, index) => (
              <Card key={q.id} className="border-law-accent/10 bg-gem-mist/10">
                <CardHeader>
                  <CardTitle className="font-serif text-lg text-law-gold">
                    Pregunta {index + 1}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base text-white">{q.text}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={answers[String(q.id)]?.toString()}
                    onValueChange={(v) => setAnswers({ ...answers, [String(q.id)]: Number(v) })}
                    className="space-y-3"
                  >
                    {q.options.map((opt: string, i: number) => (
                      <div
                        key={i}
                        className="flex cursor-pointer items-center space-x-2 rounded-lg border border-transparent p-3 transition-all hover:border-white/10 hover:bg-white/5"
                      >
                        <RadioGroupItem
                          value={String(i)}
                          id={`q${q.id}-opt${i}`}
                          className="border-law-gold text-law-gold"
                        />
                        <Label htmlFor={`q${q.id}-opt${i}`} className="flex-1 cursor-pointer">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}

            <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-t-xl border-t border-law-accent/20 bg-gem-onyx/90 p-4 backdrop-blur">
              <span className="text-sm text-gray-400">
                {Object.keys(answers).length} / {questions.length} respondidas
              </span>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-law-gold font-bold text-gem-onyx hover:bg-law-gold/90"
              >
                {loading ? "Corrigiendo..." : "Corregir Test"}
              </Button>
            </div>
          </div>
        )}

        {step === "results" && result && (
          <div className="space-y-6 pb-10">
            <Card className="border-law-accent/20 bg-gem-mist/10">
              <div className="flex justify-center py-6">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-law-gold bg-law-gold/10">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-white">{result.percentage}%</span>
                    <p className="text-xs font-bold uppercase text-law-gold">
                      {result.score}/{result.total}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {result.grading.map((item: any) => {
                // API returns { id, question, userAnswer, correctAnswer, isCorrect, explanation }
                // We don't need to look up in 'questions' array because API returns the text.
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "border",
                      item.isCorrect
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    )}
                  >
                    <CardHeader>
                      <div className="flex gap-3">
                        {item.isCorrect ? (
                          <CheckCircle2 className="mt-1 text-green-500" />
                        ) : (
                          <XCircle className="mt-1 text-red-500" />
                        )}
                        <div>
                          <CardTitle className="text-base text-gray-200">{item.question}</CardTitle>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">
                              <span
                                className={
                                  item.isCorrect
                                    ? "font-bold text-green-400"
                                    : "font-bold text-red-400"
                                }
                              >
                                Tu respuesta:
                              </span>{" "}
                              {item.userAnswer || "Sin respuesta"}
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
                      <div className="mt-2 rounded bg-black/20 p-3 text-sm text-gray-400">
                        <span className="text-xs font-bold uppercase text-gray-500">
                          Explicación:
                        </span>{" "}
                        {item.explanation}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={() => {
                setStep("config");
                setAnswers({});
                setResult(null);
              }}
              variant="outline"
              className="w-full border-white/10 text-white hover:bg-white/5"
            >
              Nuevo Test
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
