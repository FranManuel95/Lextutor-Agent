import { createApiHandler } from "@/lib/api-handler";
import { gradeExam } from "@/lib/ai-service";
import { z } from "zod";

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

    const questions = (session as any).questions;
    const rubric = (session as any).rubric;

    // 2. Grade via AI Service
    const gradingResult = await gradeExam({ questions, answers, rubric });

    if (!gradingResult.attempt || !Array.isArray(gradingResult.questions)) {
      throw new Error("Invalid AI response structure");
    }

    const finalScore = gradingResult.attempt.finalScore;

    // 3. Save Attempt
    const { data: attemptEntry, error: attemptError } = await supabase
      .from("exam_attempts")
      .insert({
        user_id: user.id,
        attempt_type: "exam_open",
        session_id: sessionId,
        area: (session as any).area || "general",
        score: finalScore,
        status: "finished",
        questions_count: questions.length,
        payload: {
          payload_version: 1,
          questions: gradingResult.questions.map((g: any, i: number) => ({
            ...g,
            id: questions[i]?.id,
            question: questions[i]?.text,
            userAnswer: answers[String(questions[i]?.id)],
          })),
          attempt: gradingResult.attempt,
          rag_used: (session as any).metadata?.rag_used || false,
        },
      } as any)
      .select()
      .single();

    if (attemptError) throw attemptError;

    return {
      attemptId: (attemptEntry as any).id,
      ...gradingResult,
    };
  },
  {
    schema: gradeSchema,
  }
);
