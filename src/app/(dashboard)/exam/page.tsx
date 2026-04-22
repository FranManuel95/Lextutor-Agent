"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Copyright } from "@/components/copyright";

const VALID_AREAS = ["laboral", "civil", "mercantil", "procesal", "otro"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];
const VALID_COUNTS = [5, 10, 15];

export default function ExamPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"config" | "taking" | "results">("config");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Config — hydrated from URL search params if present (enables "retry" flow)
  const urlArea = searchParams?.get("area");
  const urlDifficulty = searchParams?.get("difficulty");
  const urlCount = parseInt(searchParams?.get("count") ?? "", 10);

  const [config, setConfig] = useState({
    area: urlArea && VALID_AREAS.includes(urlArea) ? urlArea : "civil",
    difficulty:
      urlDifficulty && VALID_DIFFICULTIES.includes(urlDifficulty) ? urlDifficulty : "medium",
    count: VALID_COUNTS.includes(urlCount) ? urlCount : 10,
  });

  // Exam Data
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [usesRag, setUsesRag] = useState(false);
  const [sources, setSources] = useState<string[]>([]);

  // Results
  const [grading, setGrading] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exam/generate", {
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
          description: "Examen generado con tus documentos.",
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
      const res = await fetch("/api/exam/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGrading(data);
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
        {/* Header */}
        <div className="mb-8 flex flex-none items-center justify-between">
          <h1 className="font-serif text-3xl italic text-white">
            Evaluación <span className="text-law-gold">Desarrollo</span>
          </h1>
        </div>

        {step === "config" && (
          <Card className="border-law-accent/20 bg-gem-mist/10">
            <CardHeader>
              <CardTitle className="text-white">Configurar Examen</CardTitle>
              <CardDescription>
                Genera preguntas de desarrollo para practicar tu argumentación jurídica.
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
                    <SelectItem value="5">5 Preguntas</SelectItem>
                    <SelectItem value="10">10 Preguntas</SelectItem>
                    <SelectItem value="15">15 Preguntas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-law-gold font-bold text-gem-onyx hover:bg-law-gold/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Examen
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
                  <Textarea
                    value={answers[String(q.id)] || ""}
                    onChange={(e) => setAnswers({ ...answers, [String(q.id)]: e.target.value })}
                    placeholder="Escribe tu respuesta aquí..."
                    className="min-h-[150px] resize-y border-white/10 bg-gem-onyx/50 text-white"
                  />
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
                {loading ? "Corrigiendo..." : "Entregar Examen"}
              </Button>
            </div>
          </div>
        )}

        {step === "results" && grading && (
          <div className="space-y-6 pb-10">
            <Card className="border-law-accent/20 bg-gem-mist/10">
              <CardHeader>
                <CardTitle className="text-center text-3xl text-law-gold">
                  {grading.attempt?.finalScore || 0}/10
                </CardTitle>
                <CardDescription className="text-center text-lg text-white">
                  Nota Final
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-red-300">
                    <AlertTriangle size={18} /> Feedback General
                  </h4>
                  <p className="text-sm italic text-gray-300">{grading.attempt?.overallFeedback}</p>
                </div>
              </CardContent>
            </Card>

            <div className="custom-scrollbar max-h-[60vh] space-y-6 overflow-y-auto pr-2">
              {(grading.questions || []).map((item: any, index: number) => {
                // Match question by index since ID might be missing in result or different structure
                const question = questions[index] || { text: "Pregunta desconocida" };
                const userAnswer = answers[String(question.id)];

                return (
                  <Card key={index} className="border-white/5 bg-gem-mist/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base text-gray-300">
                          Pregunta: {question.text}
                        </CardTitle>
                        <Badge
                          className={
                            item.perQuestionScore >= 5
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        >
                          {item.perQuestionScore}/10
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase text-gray-500">
                          Tu Respuesta
                        </p>
                        <p className="rounded bg-black/20 p-3 text-white/80">
                          {userAnswer || (
                            <span className="italic text-gray-600">Sin respuesta</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase text-law-gold">Feedback</p>
                        <p className="text-gray-300">{item.feedback}</p>
                      </div>

                      {item.improvementTips && item.improvementTips.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase text-blue-400">
                            Tips de Mejora
                          </p>
                          <ul className="list-inside list-disc text-gray-400">
                            {item.improvementTips.map((tip: string, i: number) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={() => {
                setStep("config");
                setAnswers({});
                setGrading(null);
              }}
              variant="outline"
              className="w-full border-white/10 text-white hover:bg-white/5"
            >
              Nuevo Examen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
