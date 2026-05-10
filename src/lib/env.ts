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
  CRON_SECRET: z.string().min(16).optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // During Next.js build, server env vars may not be injected yet.
    // Return safe placeholders so module-level clients can instantiate
    // without throwing — actual requests will fail at runtime if vars are
    // truly missing, giving a clearer error than a build failure.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      // Provide safe placeholder values so module-level client instantiations
      // (GoogleGenAI, OpenAI, createClient) don't throw during build.
      // Real values from process.env override placeholders if present.
      return {
        NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-role-key",
        GEMINI_API_KEY: "placeholder-gemini-key",
        OPENAI_API_KEY: "placeholder-openai-key",
        RESEND_API_KEY: "placeholder-resend-key",
        GEMINI_FILESEARCH_STORE_ID: "fileSearchStores/placeholder",
        OPENAI_VECTOR_STORE_ID: "placeholder",
        OPENAI_ASSISTANT_ID: "placeholder",
        OPENAI_MODEL: "gpt-4o",
        AI_PROVIDER: "gemini",
        CRON_SECRET: "placeholder-cron-secret-16",
        ALLOWED_ORIGINS: "",
        ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined)),
      } as Env;
    }
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  return result.data;
}

// Validate once at module load — fails fast on misconfigured deployments.
export const env = validateEnv();
