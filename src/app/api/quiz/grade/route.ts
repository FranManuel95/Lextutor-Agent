import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";

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

    const questions = (session as any).questions as any[];

    let rawScore = 0;
    const total = questions.length;

    console.log(`\n💰 [QUIZ-GRADER] Token Usage:`);
    console.log(`   📥 Input:  0 tokens (€0.000000)`);
    console.log(`   📤 Output: 0 tokens (€0.000000)`);
    console.log(`   📊 Total:  0 tokens (€0.000000)`);
    console.log(`   💵 Costo estimado: €0.000000 EUR (Determinista - Sin IA)\n`);

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

    // 2. Save Attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        session_id: sessionId,
        answers: answers,
        grading: payloadQuestions,
        score: rawScore,
        total: total,
        area: (session as any).area || "general",
        status: "finished",
        attempt_type: "quiz",
        payload: {
          payload_version: 1,
          summary: `Quiz ${rawScore}/${total}`,
          questions: payloadQuestions,
        },
      } as any)
      .select()
      .single();

    if (attemptError) throw attemptError;

    // 3. Sync to Exam Attempts (Stats)
    const { error: syncError } = await supabase.from("exam_attempts").insert({
      user_id: user.id,
      attempt_type: "quiz",
      session_id: sessionId,
      area: (session as any).area || "general",
      score: score10,
      status: "finished",
      questions_count: total,
      payload: {
        payload_version: 1,
        summary: `Quiz ${rawScore}/${total}`,
        quiz_attempt_id: (attempt as any).id,
        rag_used: (session as any).metadata?.rag_used || false,
      },
    } as any);

    if (syncError) {
      console.error("STATS SYNC ERROR:", syncError);
    }

    return {
      attemptId: (attempt as any).id,
      score: score10,
      total,
      percentage: Math.round((rawScore / total) * 100),
      grading: payloadQuestions,
    };
  },
  {
    schema: gradeSchema,
  }
);
