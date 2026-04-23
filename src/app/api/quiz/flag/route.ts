import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";

export const runtime = "nodejs";

const flagSchema = z
  .object({
    attemptId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
    questionId: z.string().min(1).max(200),
    questionText: z.string().max(2000).optional(),
    area: z.string().max(40).optional(),
    reason: z.enum(["incorrect", "ambiguous", "off_topic", "other"]),
    comment: z.string().max(500).optional(),
  })
  .strict();

export const POST = createApiHandler(
  async ({ user, supabase, body }) => {
    const { error } = await supabase.from("question_flags").insert({
      user_id: user.id,
      attempt_id: body.attemptId ?? null,
      session_id: body.sessionId ?? null,
      question_id: body.questionId,
      question_text: body.questionText ?? null,
      area: body.area ?? null,
      reason: body.reason,
      comment: body.comment ?? null,
    });

    if (error) throw error;
    return { success: true };
  },
  {
    schema: flagSchema,
    rateLimit: RATE_LIMITS.QUESTION_FLAG,
  }
);
