import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { searchRagDocs } from "@/lib/ai-service";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const searchSchema = z
  .object({
    q: z.string().min(3).max(200),
  })
  .strict();

export const POST = createApiHandler(
  async ({ body }) => {
    if (!env.GEMINI_FILESEARCH_STORE_ID) {
      return { answer: null, sources: [], hasRag: false, unavailable: true };
    }

    const { answer, sources, hasRag } = await searchRagDocs(body.q);
    return { answer, sources, hasRag, unavailable: false };
  },
  {
    schema: searchSchema,
    rateLimit: RATE_LIMITS.RAG_SEARCH,
  }
);
