import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { z } from "zod";
import { logger } from "@/lib/logger";
import type { Json } from "@/types/database.types";

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type QuizSession = {
  id: string;
  user_id: string;
  questions: QuizQuestion[];
  area?: string;
  metadata?: { rag_used?: boolean };
};

type QuizAttemptResult = { id: string };

export const runtime = "nodejs";

const gradeSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.record(z.number()), // Map questionId (as string key) -> selectedIndex (number)
});

export const POST = createApiHandler(
  async ({ user, supabase, body }) => {
    const { sessionId, answers } = body;

    // 1. Fetch Session
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("id, user_id, questions, area, metadata")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const typedSession = session as QuizSession;
    const questions = typedSession.questions;

    let rawScore = 0;
    const total = questions.length;

    const payloadQuestions = questions.map((q) => {
      const rawIdx = answers[String(q.id)];
      // Guard: reject out-of-bounds or missing answer rather than returning undefined option
      const userIdx =
        typeof rawIdx === "number" && rawIdx >= 0 && rawIdx < q.options.length ? rawIdx : undefined;
      const isCorrect = userIdx === q.correctIndex;

      if (isCorrect) rawScore++;

      return {
        id: q.id,
        question: q.text,
        options: q.options,
        userAnswer: userIdx !== undefined ? q.options[userIdx] : null,
        correctAnswer: q.options[q.correctIndex],
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score10 = Math.round((rawScore / total) * 100) / 10; // 0.0 to 10.0

    const sessionArea = typedSession.area ?? "general";

    // 2. Save Attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        session_id: sessionId,
        answers: answers,
        grading: payloadQuestions as unknown as Json,
        score: rawScore,
        total: total,
        area: sessionArea,
        status: "finished",
        attempt_type: "quiz",
        payload: {
          payload_version: 1,
          summary: `Quiz ${rawScore}/${total}`,
          questions: payloadQuestions,
        },
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    const typedAttempt = attempt as QuizAttemptResult;

    // 3. Sync to Exam Attempts (Stats)
    const { error: syncError } = await supabase.from("exam_attempts").insert({
      user_id: user.id,
      attempt_type: "quiz",
      session_id: sessionId,
      area: sessionArea,
      score: score10,
      status: "finished",
      questions_count: total,
      payload: {
        payload_version: 1,
        summary: `Quiz ${rawScore}/${total}`,
        quiz_attempt_id: typedAttempt.id,
        rag_used: typedSession.metadata?.rag_used ?? false,
      },
    });

    if (syncError) {
      logger.error("quiz/grade: stats sync failed", syncError);
    }

    return {
      attemptId: typedAttempt.id,
      score: score10,
      total,
      percentage: Math.round((rawScore / total) * 100),
      grading: payloadQuestions,
    };
  },
  {
    schema: gradeSchema,
    rateLimit: RATE_LIMITS.QUIZ_GRADE,
  }
);
