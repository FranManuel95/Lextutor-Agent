// Rate Limiting Helper
// Provides easy-to-use rate limiting for API routes

import { createClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface RateLimitConfig {
  endpoint: string;
  limit: number;
  windowMinutes?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: string;
}

/**
 * Check if a user has exceeded their rate limit for a specific endpoint
 * @param userId - The user's UUID
 * @param config - Rate limit configuration
 * @returns Rate limit status
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id: userId,
    p_endpoint: config.endpoint,
    p_limit: config.limit,
    p_window_minutes: config.windowMinutes || 60,
  } as any);

  if (error) {
    logger.error("Rate limit RPC failed — failing closed", error, {
      endpoint: config.endpoint,
    });
    // Fail closed: deny request if rate limit check fails to prevent abuse
    return {
      allowed: false,
      current: config.limit,
      limit: config.limit,
      resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  return data as RateLimitResult;
}

/**
 * Predefined rate limit configurations for common endpoints
 */
export const RATE_LIMITS = {
  CHAT: { endpoint: "/api/chat", limit: 50, windowMinutes: 60 },
  EXAM_GENERATE: { endpoint: "/api/exam/generate", limit: 10, windowMinutes: 1440 }, // 24h
  QUIZ_GENERATE: { endpoint: "/api/quiz/generate", limit: 20, windowMinutes: 1440 }, // 24h
  AUDIO_MESSAGE: { endpoint: "/api/audio/message", limit: 30, windowMinutes: 60 },
  SETTINGS_UPDATE: { endpoint: "/api/me/settings", limit: 20, windowMinutes: 60 },
  AUTH_RESEND: { endpoint: "/api/auth/resend-verification", limit: 3, windowMinutes: 60 },
  CHAT_DELETE: { endpoint: "/api/chat/delete", limit: 30, windowMinutes: 60 },
  AUDIO_UPLOAD_URL: { endpoint: "/api/audio/create-upload", limit: 30, windowMinutes: 60 },
  RAG_DOCS_LIST: { endpoint: "/api/rag/documents", limit: 60, windowMinutes: 60 },
} as const;
