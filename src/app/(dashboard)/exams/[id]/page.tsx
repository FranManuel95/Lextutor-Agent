"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { getExamLevel, getLevelColor } from "@/lib/exams/level";
import { Copyright } from "@/components/copyright";
import { FlagQuestionButton } from "./FlagQuestionButton";

export default function ExamReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/exams/${params.id}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setAttempt(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] p-8 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-law-gold/30 border-t-law-gold"></div>
          <h3 className="font-serif text-xl text-slate-300">Cargando revisión...</h3>
        </div>
      </div>
    );
  if (!attempt)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] p-8 text-white">
        <Card className="w-full max-w-md border-red-500/20 bg-[#1E293B]">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <CardTitle className="text-xl text-slate-200">Examen no encontrado</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-400">
            <p>
              No pudimos recuperar los detalles de esta evaluación. Puede que haya sido eliminada.
            </p>
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => router.push("/exams")}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Volver al historial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  const { type, score, area, created_at, payload } = attempt;
  const questions = payload?.questions || [];
  const feedback = payload?.attempt || {}; // For open exams
  const level = getExamLevel(score || 0);

  // Helper for Quiz Display
  const renderQuizQuestion = (q: any, i: number) => {
    return (
      <div
        key={i}
        className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] shadow-sm"
      >
        {/* Header Question */}
        <div className="border-b border-slate-800 bg-[#1E293B]/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              {/* Badge pill */}
              <div className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                Pregunta {i + 1}
              </div>
              <h3 className="font-serif text-lg font-medium leading-relaxed text-slate-100 md:text-xl">
                {q.question}
              </h3>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              {q.isCorrect ? (
                <Badge className="border-green-500/50 bg-green-500/20 text-green-400 hover:bg-green-500/30">
                  Correcta
                </Badge>
              ) : (
                <Badge className="border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  Incorrecta
                </Badge>
              )}
              <FlagQuestionButton
                attemptId={attempt.id}
                questionId={String(q.id ?? q.questionId ?? i)}
                questionText={q.question}
                area={area ?? undefined}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Tu respuesta
              </label>
              <div
                className={`rounded-md border p-4 font-serif text-base ${q.isCorrect ? "border-green-500/30 bg-green-950/20 text-green-100" : "border-red-500/30 bg-red-950/20 text-red-100"}`}
              >
                {q.userAnswer || <span className="italic text-slate-500">(Sin respuesta)</span>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-blue-500">
                Respuesta Correcta
              </label>
              <div className="rounded-md border border-blue-500/30 bg-blue-950/20 p-4 font-serif text-base text-blue-100">
                {q.correctAnswer}
              </div>
            </div>
          </div>

          {q.explanation && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Explicación
              </label>
              <div className="rounded-md border border-slate-700 bg-[#1E293B] p-5 text-sm leading-7 text-slate-300">
                {q.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper for Open Exam Display
  const renderOpenQuestion = (q: any, i: number) => {
    const scoreColor = q.perQuestionScore >= 5 ? "text-green-500" : "text-red-500";
    return (
      <div
        key={i}
        className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] shadow-sm"
      >
        {/* Header Question */}
        <div className="border-b border-slate-800 bg-[#1E293B]/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              {/* Badge pill */}
              <div className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                Pregunta {i + 1}
              </div>
              <h3 className="font-serif text-lg font-medium leading-relaxed text-slate-100 md:text-xl">
                {q.question}
              </h3>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              <div>
                <div className={`font-serif text-3xl font-bold ${scoreColor}`}>
                  {q.perQuestionScore}
                  <span className="font-sans text-base text-slate-500">/10</span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  Confianza IA: {Math.round((q.confidence || 0) * 100)}%
                </div>
              </div>
              <FlagQuestionButton
                attemptId={attempt.id}
                questionId={String(q.id ?? q.questionId ?? i)}
                questionText={q.question}
                area={area ?? undefined}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6">
          {/* User Answer */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Tu Respuesta
            </label>
            <div className="min-h-[80px] w-full rounded-md border border-slate-700/50 bg-slate-900/50 p-4 font-serif font-medium leading-relaxed text-slate-200 shadow-sm">
              {q.userAnswer || <span className="italic text-slate-500">(No contestaste)</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Analysis */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Análisis del Tutor
                </label>
                <div className="rounded-md border border-slate-700 bg-[#1E293B] p-4 text-sm leading-7 text-slate-300">
                  {q.feedback}
                </div>
              </div>

              {/* Missing Points */}
              {q.missingPoints?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-500">
                    <XCircle className="h-4 w-4" /> Puntos Faltantes
                  </h4>
                  <ul className="space-y-2 pl-1">
                    {q.missingPoints.map((p: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="mt-1.5 h-[4px] min-w-[4px] rounded-full bg-red-500 text-red-500/50"></span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Tips */}
              {q.improvementTips?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-500">
                    <BookOpen className="h-4 w-4" /> Consejos de Mejora
                  </h4>
                  <ul className="space-y-2 pl-1">
                    {q.improvementTips.map((p: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="mt-1.5 h-[4px] min-w-[4px] rounded-full bg-amber-500 text-amber-500/50"></span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Rubric Card */}
            <div className="h-fit rounded-lg border border-slate-700/50 bg-[#1E293B] p-5 shadow-sm">
              <h4 className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                Rúbrica
              </h4>
              <div className="space-y-5">
                {q.rubricScores &&
                  Object.entries(q.rubricScores).map(([key, val]: any) => {
                    const maxVal = key === "accuracy" ? 4 : key === "reasoning" ? 3 : 2; // Approximate weights
                    const percentage = (val / maxVal) * 100;

                    // Dynamic color logic
                    let indicatorColor = "bg-green-500";
                    if (percentage < 40) indicatorColor = "bg-red-500";
                    else if (percentage < 60) indicatorColor = "bg-orange-500";
                    else if (percentage < 80) indicatorColor = "bg-amber-400";

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-slate-400">
                          <span>
                            {key === "accuracy"
                              ? "Precisión"
                              : key === "reasoning"
                                ? "Razonamiento"
                                : key === "clarity"
                                  ? "Claridad"
                                  : key}
                          </span>
                          <span className="text-slate-200">{val} Pts</span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-1.5 bg-slate-800"
                          indicatorClassName={indicatorColor}
                        />
                      </div>
                    );
                  })}
                <Separator className="my-4 bg-slate-700" />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase text-slate-400">Total</span>
                  <span className="text-xl font-bold text-slate-200">
                    {q.perQuestionScore}{" "}
                    <span className="text-xs font-normal text-slate-500">/ 10</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="container mx-auto max-w-5xl space-y-10 px-6 py-8 pb-24 md:px-16">
        {/* Top Bar with Back Button on RIGHT */}
        <div className="flex flex-wrap justify-end gap-2 pt-4">
          <Button
            asChild
            variant="outline"
            className="gap-2 border-law-gold/40 bg-law-gold/5 text-law-gold hover:bg-law-gold/10 hover:text-law-gold"
          >
            <Link
              href={`${attempt.attempt_type === "exam_open" ? "/exam" : "/quiz"}?area=${encodeURIComponent(area ?? "civil")}`}
            >
              <RotateCw className="h-4 w-4" /> Volver a intentar
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al historial
          </Button>
        </div>

        {/* Exam Header */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-slate-300"
              >
                {attempt.attempt_type === "quiz" ? "TEST RÁPIDO" : "EXAMEN DESARROLLO"}
              </Badge>
              <span className="text-slate-500">|</span>
              <span className="font-medium capitalize text-slate-300">{area}</span>
              <span className="text-slate-500">
                • {format(new Date(created_at), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white md:text-6xl">
              Resultado: {(score || 0).toFixed(1)}
              <span className="ml-2 font-sans text-2xl font-light text-slate-500">/ 10</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              className={`px-6 py-2 text-base font-medium tracking-wide ${getLevelColor(level)}`}
            >
              {level}
            </Badge>
          </div>
        </div>

        {/* Overall Feedback (Only Open) */}
        {attempt.attempt_type === "exam_open" && feedback.overallFeedback && (
          <Card className="overflow-hidden border border-indigo-500/20 bg-[#1E293B] shadow-lg">
            <div className="p-6 md:p-8">
              <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-indigo-300">
                <CheckCircle2 className="h-6 w-6 text-indigo-400" /> Feedback Global
              </h3>

              <p className="font-serif text-lg leading-relaxed text-indigo-200/80">
                {feedback.overallFeedback}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-8 border-t border-indigo-500/20 pt-8 md:grid-cols-2">
                {feedback.strengths?.length > 0 && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-green-400">
                      Fortalezas Identificadas
                    </span>
                    <ul className="space-y-2">
                      {feedback.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                          <span className="mt-0.5 shrink-0 text-green-400">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.weaknesses?.length > 0 && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                      Debilidades a Trabajar
                    </span>
                    <ul className="space-y-2">
                      {feedback.weaknesses.map((s: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                          <span className="mt-1 shrink-0 text-red-400">•</span>
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
          <h3 className="border-l-4 border-law-gold pl-4 font-serif text-2xl font-bold text-slate-200">
            Detalle de Preguntas
          </h3>
          <div className="space-y-12">
            {questions.map((q: any, i: number) =>
              attempt.attempt_type === "quiz" ? renderQuizQuestion(q, i) : renderOpenQuestion(q, i)
            )}
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="mt-12 w-full border-t border-white/5 bg-[#020617] py-8">
        <Copyright className="text-slate-600" />
      </footer>
    </div>
  );
}
