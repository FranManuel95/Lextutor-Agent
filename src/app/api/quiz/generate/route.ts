import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { generateQuiz } from "@/lib/ai-service";
import { z } from "zod";

export const runtime = "nodejs";

const generateSchema = z.object({
    area: z.enum(['laboral', 'civil', 'mercantil', 'procesal', 'otro']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    count: z.number().min(10).max(20).default(15)
});

export const POST = createApiHandler(
    async ({ user, supabase, body }) => {
        const { area, difficulty, count } = body;

        // 1. Generate Quiz via AI Service
        const { questions, ragUsed } = await generateQuiz({ area, difficulty, count });

        // 2. Save Session to DB
        const { data: session, error } = await supabase
            .from('quiz_sessions')
            .insert({
                user_id: user.id,
                area,
                difficulty,
                questions: questions,
                metadata: { rag_used: ragUsed }
            } as any)
            .select()
            .single();

        if (error) throw error;

        // 3. Return sanitized questions (without correctIndex/explanation) to client
        const clientQuestions = questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            options: q.options
        }));

        return {
            sessionId: (session as any).id,
            questions: clientQuestions,
            ragUsed
        };
    },
    {
        schema: generateSchema,
        rateLimit: RATE_LIMITS.QUIZ_GENERATE
    }
);
