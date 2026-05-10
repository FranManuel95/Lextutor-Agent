import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import type { Json } from "@/types/database.types";

export const runtime = "nodejs";

interface AttemptPayload {
  quiz_attempt_id?: string;
  questions?: Json;
}

interface QuizAttemptDetail {
  payload: AttemptPayload;
  grading: Json;
}

interface HydratedAttempt {
  id: string;
  user_id: string;
  attempt_type: string;
  area: string;
  score: number;
  status: string;
  questions_count: number | null;
  payload: AttemptPayload;
  created_at: string;
  updated_at: string;
  chat_id: string | null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.EXAM_DETAIL);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // HYDRATION LOGIC FOR QUIZZES
  // The unified `exam_attempts` table stores a light payload for quizzes.
  // We need to fetch the full questions/answers from `quiz_attempts`.
  const attemptData: HydratedAttempt = {
    ...attempt,
    payload: (attempt.payload ?? {}) as AttemptPayload,
  };

  if (attemptData.attempt_type === "quiz" && attemptData.payload?.quiz_attempt_id) {
    const { data: quizDetail, error: quizError } = await supabase
      .from("quiz_attempts")
      .select("payload, grading")
      .eq("id", attemptData.payload.quiz_attempt_id)
      .single();

    if (!quizError && quizDetail) {
      const typedQuizDetail = quizDetail as unknown as QuizAttemptDetail;
      // Prefer payload.questions, fallback to grading
      const questions = typedQuizDetail.payload?.questions ?? typedQuizDetail.grading;

      if (questions) {
        attemptData.payload = {
          ...attemptData.payload,
          questions,
        };
      }
    }
  }

  return NextResponse.json(attemptData);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.EXAM_DELETE);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from("exam_attempts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
