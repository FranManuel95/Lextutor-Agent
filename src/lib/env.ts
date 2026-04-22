import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  GEMINI_FILESEARCH_STORE_ID: z.string().startsWith("fileSearchStores/").optional(),
  OPENAI_VECTOR_STORE_ID: z.string().optional(),
  OPENAI_ASSISTANT_ID: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  AI_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),
  // Shared secret for scheduled/cron-like endpoints (e.g. weekly summary email).
  // When absent, those endpoints will reject every request.
  CRON_SECRET: z.string().min(16).optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  return result.data;
}

// Validate once at module load — fails fast on misconfigured deployments.
export const env = validateEnv();
