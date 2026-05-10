import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSupabaseFrom = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockGenerateExam = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createApiHandler: (handler: any, options: any) => async (request: NextRequest) => {
    const { NextResponse } = await import("next/server");
    const { z } = await import("zod");
    try {
      // Rate limit check
      if (options?.rateLimit) {
        const { checkRateLimit } = await import("@/lib/rateLimit");
        const rateLimit = await checkRateLimit("user-test", options.rateLimit);
        if (!rateLimit.allowed) {
          return NextResponse.json(
            {
              error: `Límite excedido. Intenta de nuevo a las ${new Date(rateLimit.resetAt).toLocaleTimeString("es-ES")}.`,
              resetAt: rateLimit.resetAt,
            },
            { status: 429 }
          );
        }
      }

      let body = {};
      if (request.method !== "GET" && request.method !== "DELETE") {
        const json = await request.json();
        body = options?.schema ? options.schema.parse(json) : json;
      }

      const result = await handler({
        user: { id: "user-test" },
        supabase: { from: mockSupabaseFrom },
        body,
      });
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result);
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation Error", details: e.errors }, { status: 400 });
      }
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Internal Server Error" },
        { status: 500 }
      );
    }
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  RATE_LIMITS: {
    EXAM_GENERATE: { endpoint: "/api/exam/generate", limit: 10, windowMinutes: 1440 },
  },
}));

vi.mock("@/lib/ai-service", () => ({
  generateExam: mockGenerateExam,
}));

const MOCK_QUESTIONS = [
  { id: 1, text: "¿Qué establece el artículo 1902 del Código Civil?" },
  { id: 2, text: "¿Cuál es el plazo de prescripción general en derecho civil?" },
  { id: 3, text: "Explica el concepto de responsabilidad extracontractual." },
];

const MOCK_RUBRIC = {
  "1": "Debe mencionar la obligación de reparar el daño causado.",
  "2": "15 años (artículo 1964 CC).",
  "3": "Obligación de indemnizar derivada de acto u omisión culposo sin relación contractual.",
};

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/exam/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/exam/generate", () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
    mockCheckRateLimit.mockReset();
    mockGenerateExam.mockReset();

    // Default: rate limit allowed
    mockCheckRateLimit.mockResolvedValue({ allowed: true, current: 1, limit: 10 });
  });

  it("returns 200 with questions and sessionId on valid body", async () => {
    mockGenerateExam.mockResolvedValue({
      questions: MOCK_QUESTIONS,
      rubric: MOCK_RUBRIC,
      ragUsed: true,
      sources: ["Código Civil"],
    });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "exam_sessions") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "session-abc-123" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const { POST } = await import("@/app/api/exam/generate/route");
    const res = await POST(makeRequest({ area: "civil", difficulty: "medium", count: 3 }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe("session-abc-123");
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.questions).toHaveLength(3);
    expect(body.ragUsed).toBe(true);
    expect(body.sources).toContain("Código Civil");
  });

  it("returns 400 when count exceeds max (count > 10)", async () => {
    const { POST } = await import("@/app/api/exam/generate/route");
    const res = await POST(makeRequest({ area: "civil", difficulty: "hard", count: 99 }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation Error");
  });

  it("returns 429 when rate limit is exhausted", async () => {
    const resetAt = new Date(Date.now() + 3600_000).toISOString();
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      current: 10,
      limit: 10,
      resetAt,
    });

    const { POST } = await import("@/app/api/exam/generate/route");
    const res = await POST(makeRequest({ area: "laboral", difficulty: "easy", count: 2 }));

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.resetAt).toBe(resetAt);
  });
});
