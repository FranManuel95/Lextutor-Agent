import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockRequireAdmin = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockRange = vi.fn();

// Build a chainable Supabase query mock: from().select().order().range()
const supabaseMock = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        range: mockRange,
      })),
    })),
  })),
};

vi.mock("@/server/security/requireAdmin", () => ({
  requireAdmin: mockRequireAdmin,
}));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  RATE_LIMITS: { RAG_DOCS_LIST: { endpoint: "rag-docs-list", limit: 100, windowMinutes: 60 } },
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

function makeRequest(url = "http://localhost:3000/api/rag/documents") {
  return new NextRequest(url);
}

describe("GET /api/rag/documents", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
    mockCheckRateLimit.mockReset();
    mockRange.mockReset();
    supabaseMock.from.mockClear();
  });

  it("returns 401 when requireAdmin throws Unauthorized", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when requireAdmin throws Forbidden", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Forbidden"));
    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: supabaseMock, user: { id: "u1" } });
    mockCheckRateLimit.mockResolvedValue({ allowed: false });
    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 200 with items and count on success", async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: supabaseMock, user: { id: "u1" } });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    const rows = [
      {
        id: "1",
        document_name: "doc1.pdf",
        display_name: "Doc 1",
        area: "civil",
        created_at: "2026-01-01",
      },
    ];
    mockRange.mockResolvedValue({ data: rows, count: 1, error: null });

    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual(rows);
    expect(body.count).toBe(1);
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
  });

  it("clamps limit to upper bound 200", async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: supabaseMock, user: { id: "u1" } });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockRange.mockResolvedValue({ data: [], count: 0, error: null });

    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(makeRequest("http://localhost:3000/api/rag/documents?limit=9999"));
    const body = await res.json();
    expect(body.limit).toBe(200);
    // range(offset, offset + limit - 1) → range(0, 199)
    expect(mockRange).toHaveBeenCalledWith(0, 199);
  });

  it("clamps limit to lower bound 1 and offset to 0 for negative inputs", async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: supabaseMock, user: { id: "u1" } });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockRange.mockResolvedValue({ data: [], count: 0, error: null });

    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(
      makeRequest("http://localhost:3000/api/rag/documents?limit=-5&offset=-10")
    );
    const body = await res.json();
    expect(body.limit).toBe(1);
    expect(body.offset).toBe(0);
  });

  it("falls back to defaults when limit/offset are non-numeric", async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: supabaseMock, user: { id: "u1" } });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockRange.mockResolvedValue({ data: [], count: 0, error: null });

    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(
      makeRequest("http://localhost:3000/api/rag/documents?limit=abc&offset=xyz")
    );
    const body = await res.json();
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
  });

  it("returns 500 when the Supabase query errors", async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: supabaseMock, user: { id: "u1" } });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockRange.mockResolvedValue({ data: null, count: null, error: { message: "db failed" } });

    const { GET } = await import("@/app/api/rag/documents/route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
