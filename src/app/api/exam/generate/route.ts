import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { generateExam } from "@/lib/ai-service";
import { z } from "zod";
import type { Json } from "@/types/database.types";

interface ExamSessionInsert {
  user_id: string;
  area: string;
  difficulty: string;
  questions: Json;
  rubric: Json;
  metadata: Json;
}

interface ExamSessionRow {
  id: string;
}

export const runtime = "nodejs";
export const maxDuration = 60;

const generateSchema = z.object({
  area: z.string().default("general"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().min(1).max(10).default(3),
});

export const POST = createApiHandler(
  async ({ user, supabase, body }) => {
    const { area, difficulty, count } = body;

    // 1. Generate Exam via AI Service
    const { questions, rubric, ragUsed, sources } = await generateExam({ area, difficulty, count });

    // 2. Save Session to DB
    const insertPayload: ExamSessionInsert = {
      user_id: user.id,
      area,
      difficulty,
      questions: questions as unknown as Json,
      rubric: rubric as unknown as Json,
      metadata: {
        rag_used: ragUsed,
        type: "development",
        sources: sources || [],
      },
    };
    const { data: session, error } = await (
      supabase.from("exam_sessions") as unknown as {
        insert: (v: ExamSessionInsert) => {
          select: () => { single: () => Promise<{ data: ExamSessionRow | null; error: unknown }> };
        };
      }
    )
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    return {
      sessionId: session?.id,
      questions,
      ragUsed,
      sources,
    };
  },
  {
    schema: generateSchema,
    rateLimit: RATE_LIMITS.EXAM_GENERATE,
  }
);
