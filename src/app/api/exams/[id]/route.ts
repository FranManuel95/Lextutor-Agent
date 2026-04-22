import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const attemptData = attempt as any;

  if (attemptData.attempt_type === "quiz" && attemptData.payload?.quiz_attempt_id) {
    const { data: quizDetail, error: quizError } = await supabase
      .from("quiz_attempts")
      .select("payload, grading")
      .eq("id", attemptData.payload.quiz_attempt_id)
      .single();

    if (!quizError && quizDetail) {
      // Prefer payload.questions, fallback to grading
      const questions = (quizDetail as any).payload?.questions || (quizDetail as any).grading;

      if (questions) {
        attemptData.payload = {
          ...attemptData.payload,
          questions: questions,
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
