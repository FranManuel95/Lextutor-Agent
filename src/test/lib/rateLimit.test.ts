import { describe, it, expect } from "vitest";
import { RATE_LIMITS } from "@/lib/rateLimit";

describe("RATE_LIMITS constants", () => {
  it("defines CHAT limit as 50 requests per hour", () => {
    expect(RATE_LIMITS.CHAT.limit).toBe(50);
    expect(RATE_LIMITS.CHAT.windowMinutes).toBe(60);
    expect(RATE_LIMITS.CHAT.endpoint).toBe("/api/chat");
  });

  it("defines EXAM_GENERATE as 10 requests per 24h", () => {
    expect(RATE_LIMITS.EXAM_GENERATE.limit).toBe(10);
    expect(RATE_LIMITS.EXAM_GENERATE.windowMinutes).toBe(1440);
  });

  it("defines QUIZ_GENERATE as 20 requests per 24h", () => {
    expect(RATE_LIMITS.QUIZ_GENERATE.limit).toBe(20);
    expect(RATE_LIMITS.QUIZ_GENERATE.windowMinutes).toBe(1440);
  });

  it("defines AUDIO_MESSAGE as 30 requests per hour", () => {
    expect(RATE_LIMITS.AUDIO_MESSAGE.limit).toBe(30);
    expect(RATE_LIMITS.AUDIO_MESSAGE.windowMinutes).toBe(60);
  });

  it("all endpoints start with /api/", () => {
    Object.values(RATE_LIMITS).forEach(({ endpoint }) => {
      expect(endpoint).toMatch(/^\/api\//);
    });
  });
});
