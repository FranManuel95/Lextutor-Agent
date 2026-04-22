import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSupabaseFrom = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createApiHandler: (handler: any, options: any) => async (request: NextRequest) => {
    const { NextResponse } = await import("next/server");
    const { z } = await import("zod");
    try {
      const json = await request.json();
      const body = options?.schema ? options.schema.parse(json) : json;
      const result = await handler({
        user: { id: "user-test" },
        supabase: { from: mockSupabaseFrom },
        body,
      });
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation Error", details: e.errors }, { status: 400 });
      }
      return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 });
    }
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
  RATE_LIMITS: { QUIZ_GRADE: { endpoint: "/api/quiz/grade", limit: 50, windowMinutes: 1440 } },
}));

const QUESTIONS = [
  {
    id: "q1",
    text: "¿Capital de España?",
    options: ["Madrid", "Barcelona", "Sevilla"],
    correctIndex: 0,
    explanation: "Madrid.",
  },
  {
    id: "q2",
    text: "¿Artículo 1 CE?",
    options: ["Monarquía", "República", "Federación"],
    correctIndex: 0,
    explanation: "Monarquía parlamentaria.",
  },
  {
    id: "q3",
    text: "¿Código Civil año?",
    options: ["1888", "1978", "1812"],
    correctIndex: 0,
    explanation: "1889.",
  },
];

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/quiz/grade", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function buildFromMock(sessionResult: any, attemptId = "att-1") {
  const sessionSingle = vi.fn().mockResolvedValue(sessionResult);
  const attemptSingle = vi.fn().mockResolvedValue({ data: { id: attemptId }, error: null });
  const attemptSelect = vi.fn(() => ({ single: attemptSingle }));
  const quizInsert = vi.fn(() => ({ select: attemptSelect }));
  const examInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  return (table: string) => {
    if (table === "quiz_sessions") {
      return { select: () => ({ eq: () => ({ eq: () => ({ single: sessionSingle }) }) }) };
    }
    if (table === "quiz_attempts") return { insert: quizInsert };
    if (table === "exam_attempts") return { insert: examInsert };
    return {};
  };
}

describe("POST /api/quiz/grade", () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
  });

  it("returns 404 when session not found", async () => {
    mockSupabaseFrom.mockImplementation(
      buildFromMock({ data: null, error: { message: "not found" } })
    );
    const { POST } = await import("@/app/api/quiz/grade/route");
    const res = await POST(
      makeRequest({ sessionId: "00000000-0000-0000-0000-000000000001", answers: {} })
    );
    expect(res.status).toBe(404);
  });

  it("scores 2/3 correct → score ≈ 6.7, percentage 67", async () => {
    mockSupabaseFrom.mockImplementation(
      buildFromMock({
        data: { id: "s1", user_id: "user-test", questions: QUESTIONS, area: "civil", metadata: {} },
        error: null,
      })
    );
    const { POST } = await import("@/app/api/quiz/grade/route");
    const res = await POST(
      makeRequest({
        sessionId: "00000000-0000-0000-0000-000000000001",
        answers: { q1: 0, q2: 0, q3: 1 },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBeCloseTo(6.7, 0);
    expect(body.percentage).toBe(67);
    expect(body.total).toBe(3);
  });

  it("scores 3/3 correct → score 10, percentage 100", async () => {
    mockSupabaseFrom.mockImplementation(
      buildFromMock({
        data: { id: "s1", user_id: "user-test", questions: QUESTIONS, area: "civil", metadata: {} },
        error: null,
      })
    );
    const { POST } = await import("@/app/api/quiz/grade/route");
    const res = await POST(
      makeRequest({
        sessionId: "00000000-0000-0000-0000-000000000001",
        answers: { q1: 0, q2: 0, q3: 0 },
      })
    );
    const body = await res.json();
    expect(body.score).toBe(10);
    expect(body.percentage).toBe(100);
  });

  it("treats out-of-bounds index as null (not counted as correct)", async () => {
    mockSupabaseFrom.mockImplementation(
      buildFromMock({
        data: { id: "s1", user_id: "user-test", questions: QUESTIONS, area: "civil", metadata: {} },
        error: null,
      })
    );
    const { POST } = await import("@/app/api/quiz/grade/route");
    const res = await POST(
      makeRequest({
        sessionId: "00000000-0000-0000-0000-000000000001",
        // q1: 99 out-of-bounds, q2: -1 negative, q3: 0 correct
        answers: { q1: 99, q2: -1, q3: 0 },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.percentage).toBe(33);
    const q1Result = body.grading.find((g: any) => g.id === "q1");
    expect(q1Result.userAnswer).toBeNull();
    expect(q1Result.isCorrect).toBe(false);
  });

  it("returns attemptId in response body", async () => {
    mockSupabaseFrom.mockImplementation(
      buildFromMock(
        {
          data: {
            id: "s1",
            user_id: "user-test",
            questions: QUESTIONS,
            area: "civil",
            metadata: {},
          },
          error: null,
        },
        "returned-id"
      )
    );
    const { POST } = await import("@/app/api/quiz/grade/route");
    const res = await POST(
      makeRequest({ sessionId: "00000000-0000-0000-0000-000000000001", answers: {} })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.attemptId).toBe("returned-id");
  });
});
