import { createApiHandler } from "@/lib/api-handler";
import { gradeExam } from "@/lib/ai-service";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { z } from "zod";
import type { Json } from "@/types/database.types";

interface GradedQuestion {
  correct: boolean;
  explanation?: string;
  [key: string]: unknown;
}

interface ExamQuestion {
  id: string | number;
  text: string;
  [key: string]: unknown;
}

type SessionData = {
  id: string;
  user_id: string;
  questions: ExamQuestion[];
  rubric: Record<string, unknown>;
  area?: string;
  metadata?: { rag_used?: boolean };
  [key: string]: unknown;
};

interface ExamAttemptRow {
  id: string;
}

export const runtime = "nodejs";

const gradeSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.record(z.string()),
});

export const POST = createApiHandler(
  async ({ user, supabase, body }) => {
    const { sessionId, answers } = body;

    // 1. Fetch Session & Rubric
    const { data: session, error: sessionError } = await supabase
      .from("exam_sessions")
      .select("id, user_id, questions, rubric, area, metadata")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) throw new Error("Session not found");

    const typedSession = session as SessionData;
    const questions = typedSession.questions;
    const rubric = typedSession.rubric;

    // 2. Grade via AI Service
    const gradingResult = await gradeExam({ questions, answers, rubric });

    if (!gradingResult.attempt || !Array.isArray(gradingResult.questions)) {
      throw new Error("Invalid AI response structure");
    }

    const finalScore = gradingResult.attempt.finalScore;
    const questionsArr = Array.isArray(questions) ? questions : [];

    // 3. Save Attempt
    const { data: attemptEntry, error: attemptError } = await supabase
      .from("exam_attempts")
      .insert({
        user_id: user.id,
        attempt_type: "exam_open",
        session_id: sessionId,
        area: (typedSession.area || "general") as
          | "laboral"
          | "civil"
          | "mercantil"
          | "procesal"
          | "otro"
          | "general",
        score: finalScore,
        status: "finished",
        questions_count: questionsArr.length,
        payload: {
          payload_version: 1,
          questions: gradingResult.questions.map((g: GradedQuestion, i: number) => ({
            ...g,
            id: questions[i]?.id,
            question: questions[i]?.text,
            userAnswer: answers[String(questions[i]?.id)],
          })),
          attempt: gradingResult.attempt,
          rag_used: typedSession.metadata?.rag_used || false,
        } as unknown as Json,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    const typedAttempt = attemptEntry as unknown as ExamAttemptRow;

    return {
      attemptId: typedAttempt.id,
      ...gradingResult,
    };
  },
  {
    schema: gradeSchema,
    rateLimit: RATE_LIMITS.EXAM_GRADE,
  }
);
