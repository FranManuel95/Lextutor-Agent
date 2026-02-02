import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { generateExam } from "@/lib/ai-service";
import { z } from "zod";

export const runtime = "nodejs";

const generateSchema = z.object({
    area: z.string().default('general'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    count: z.number().min(1).max(10).default(3)
});

export const POST = createApiHandler(
    async ({ user, supabase, body }) => {
        const { area, difficulty, count } = body;

        // 1. Generate Exam via AI Service
        const { questions, rubric, ragUsed, sources } = await generateExam({ area, difficulty, count });

        // 2. Save Session to DB
        const { data: session, error } = await supabase
            .from('exam_sessions')
            .insert({
                user_id: user.id,
                area,
                difficulty,
                questions,
                rubric,
                metadata: {
                    rag_used: ragUsed,
                    type: 'development',
                    sources: sources || []
                }
            } as any)
            .select()
            .single();

        if (error) throw error;

        return {
            sessionId: (session as any).id,
            questions,
            ragUsed,
            sources
        };
    },
    {
        schema: generateSchema,
        rateLimit: RATE_LIMITS.EXAM_GENERATE
    }
);
