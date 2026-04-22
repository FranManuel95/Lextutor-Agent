import { describe, it, expect } from "vitest";
import { RATE_LIMITS } from "@/lib/rateLimit";

describe("RATE_LIMITS — nuevas constantes de grade", () => {
  it("defines EXAM_GRADE as 30 requests per 24h", () => {
    expect(RATE_LIMITS.EXAM_GRADE.limit).toBe(30);
    expect(RATE_LIMITS.EXAM_GRADE.windowMinutes).toBe(1440);
    expect(RATE_LIMITS.EXAM_GRADE.endpoint).toBe("/api/exam/grade");
  });

  it("defines QUIZ_GRADE as 50 requests per 24h", () => {
    expect(RATE_LIMITS.QUIZ_GRADE.limit).toBe(50);
    expect(RATE_LIMITS.QUIZ_GRADE.windowMinutes).toBe(1440);
    expect(RATE_LIMITS.QUIZ_GRADE.endpoint).toBe("/api/quiz/grade");
  });

  it("EXAM_GRADE limit is higher than EXAM_GENERATE (students can re-grade)", () => {
    expect(RATE_LIMITS.EXAM_GRADE.limit).toBeGreaterThan(RATE_LIMITS.EXAM_GENERATE.limit);
  });

  it("QUIZ_GRADE limit is higher than QUIZ_GENERATE (students can re-grade)", () => {
    expect(RATE_LIMITS.QUIZ_GRADE.limit).toBeGreaterThan(RATE_LIMITS.QUIZ_GENERATE.limit);
  });

  it("all endpoints start with /api/", () => {
    Object.values(RATE_LIMITS).forEach(({ endpoint }) => {
      expect(endpoint).toMatch(/^\/api\//);
    });
  });
});
