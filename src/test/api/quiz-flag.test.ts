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
  RATE_LIMITS: {
    QUESTION_FLAG: { endpoint: "/api/quiz/flag", limit: 30, windowMinutes: 1440 },
  },
}));

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/quiz/flag", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function buildSuccessMock() {
  const insert = vi.fn().mockResolvedValue({ data: null, error: null });
  return (table: string) => {
    if (table === "question_flags") return { insert };
    return {};
  };
}

describe("POST /api/quiz/flag", () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
  });

  it("accepts a valid flag submission and returns success", async () => {
    mockSupabaseFrom.mockImplementation(buildSuccessMock());
    const { POST } = await import("@/app/api/quiz/flag/route");

    const res = await POST(
      makeRequest({
        questionId: "q1",
        reason: "incorrect",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("accepts optional fields (attemptId, comment, area)", async () => {
    mockSupabaseFrom.mockImplementation(buildSuccessMock());
    const { POST } = await import("@/app/api/quiz/flag/route");

    const res = await POST(
      makeRequest({
        questionId: "q-42",
        attemptId: "00000000-0000-0000-0000-000000000001",
        reason: "ambiguous",
        area: "civil",
        comment: "La pregunta tiene dos respuestas válidas",
      })
    );

    expect(res.status).toBe(200);
  });

  it("rejects unknown reason enum value", async () => {
    mockSupabaseFrom.mockImplementation(buildSuccessMock());
    const { POST } = await import("@/app/api/quiz/flag/route");

    const res = await POST(
      makeRequest({
        questionId: "q1",
        reason: "spam",
      })
    );

    expect(res.status).toBe(400);
  });

  it("rejects missing required fields", async () => {
    mockSupabaseFrom.mockImplementation(buildSuccessMock());
    const { POST } = await import("@/app/api/quiz/flag/route");

    const res = await POST(makeRequest({ reason: "incorrect" }));
    expect(res.status).toBe(400);
  });

  it("rejects unknown fields due to .strict()", async () => {
    mockSupabaseFrom.mockImplementation(buildSuccessMock());
    const { POST } = await import("@/app/api/quiz/flag/route");

    const res = await POST(
      makeRequest({
        questionId: "q1",
        reason: "incorrect",
        someExtraField: "should be rejected",
      })
    );
    expect(res.status).toBe(400);
  });
});
