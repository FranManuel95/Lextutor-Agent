import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSearchRagDocs = vi.fn();
const mockEnv = { GEMINI_FILESEARCH_STORE_ID: "fileSearchStores/test-store" };

vi.mock("@/lib/api-handler", () => ({
  createApiHandler: (handler: any, options: any) => async (request: NextRequest) => {
    const { NextResponse } = await import("next/server");
    const { z } = await import("zod");
    try {
      const json = await request.json();
      const body = options?.schema ? options.schema.parse(json) : json;
      const result = await handler({
        user: { id: "user-test" },
        supabase: {},
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
    RAG_SEARCH: { endpoint: "/api/rag/search", limit: 20, windowMinutes: 60 },
  },
}));

vi.mock("@/lib/ai-service", () => ({
  searchRagDocs: mockSearchRagDocs,
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/rag/search", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/rag/search", () => {
  beforeEach(() => {
    mockSearchRagDocs.mockReset();
    mockEnv.GEMINI_FILESEARCH_STORE_ID = "fileSearchStores/test-store";
  });

  it("returns answer and sources when RAG is available", async () => {
    mockSearchRagDocs.mockResolvedValue({
      answer: "El arrendamiento se regula en el Título VI del Código Civil.",
      sources: ["Codigo Civil", "LAU 1994"],
      hasRag: true,
    });

    const { POST } = await import("@/app/api/rag/search/route");
    const res = await POST(makeRequest({ q: "arrendamiento urbano" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unavailable).toBe(false);
    expect(body.answer).toContain("arrendamiento");
    expect(body.sources).toContain("Codigo Civil");
  });

  it("returns unavailable when GEMINI_FILESEARCH_STORE_ID is not set", async () => {
    mockEnv.GEMINI_FILESEARCH_STORE_ID = "";

    const { POST } = await import("@/app/api/rag/search/route");
    const res = await POST(makeRequest({ q: "contrato de trabajo" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unavailable).toBe(true);
    expect(body.answer).toBeNull();
    expect(mockSearchRagDocs).not.toHaveBeenCalled();
  });

  it("rejects queries shorter than 3 characters", async () => {
    const { POST } = await import("@/app/api/rag/search/route");
    const res = await POST(makeRequest({ q: "ab" }));

    expect(res.status).toBe(400);
  });

  it("rejects queries longer than 200 characters", async () => {
    const { POST } = await import("@/app/api/rag/search/route");
    const res = await POST(makeRequest({ q: "a".repeat(201) }));

    expect(res.status).toBe(400);
  });

  it("rejects unknown fields due to .strict()", async () => {
    mockSearchRagDocs.mockResolvedValue({ answer: "ok", sources: [], hasRag: false });
    const { POST } = await import("@/app/api/rag/search/route");

    const res = await POST(makeRequest({ q: "prescripcion", extraField: "hack" }));
    expect(res.status).toBe(400);
  });
});
