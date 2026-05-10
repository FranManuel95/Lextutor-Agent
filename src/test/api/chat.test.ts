import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------- Supabase mock (used by @/lib/supabase → api-handler) ----------
const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockRpc = vi.fn();

// We need a chainable query builder that returns itself for all methods
// until .single() or a terminal method is called.
function makeQueryBuilder(resolvedValue: unknown) {
  const builder: Record<string, unknown> = {};
  const methods = ["select", "eq", "order", "limit", "update"];
  methods.forEach((m) => {
    builder[m] = () => builder;
  });
  builder["single"] = vi.fn().mockResolvedValue(resolvedValue);
  // make "from(...).insert(...)" resolve directly
  builder["insert"] = mockInsert;
  return builder;
}

// Per-table mock data
const chatRow = { user_id: "user-123", title: "Test Chat" };
const profileRow = {
  tutor_prefs: { area: "civil", modes: [], detailLevel: "normal" },
  full_name: "Ana García",
};
const messagesRows = { data: [], error: null };
const summaryRow = { data: null, error: null };

const mockFrom = vi.fn((table: string) => {
  if (table === "profiles") return makeQueryBuilder({ data: profileRow, error: null });
  if (table === "chats") return makeQueryBuilder({ data: chatRow, error: null });
  if (table === "messages") {
    const b = makeQueryBuilder(messagesRows);
    (b as Record<string, unknown>)["insert"] = mockInsert;
    return b;
  }
  if (table === "chat_summaries") return makeQueryBuilder(summaryRow);
  if (table === "student_events") {
    const b = makeQueryBuilder({ data: null, error: null });
    (b as Record<string, unknown>)["insert"] = vi.fn().mockResolvedValue({ error: null });
    return b;
  }
  return makeQueryBuilder({ data: null, error: null });
});

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

// ---------- Rate limit mock ----------
const mockCheckRateLimit = vi.fn();
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  RATE_LIMITS: {
    CHAT: { endpoint: "/api/chat", limit: 50, windowMinutes: 60 },
  },
}));

// ---------- AI service mock ----------
vi.mock("@/lib/ai-service", () => ({
  generateResponse: vi.fn().mockResolvedValue("Respuesta simulada del asistente."),
}));

// ---------- server-utils (chatSchema) mock ----------
vi.mock("@/lib/server-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server-utils")>();
  return { ...actual };
});

// ---------- Helpers ----------
function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  chatId: "11111111-1111-1111-1111-111111111111",
  message: "Explícame el artículo 24 CE",
};

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({
      data: { allowed: true, current: 1, limit: 50, resetAt: new Date().toISOString() },
      error: null,
    });
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      current: 1,
      limit: 50,
      resetAt: new Date().toISOString(),
    });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 200 with AI response when session is valid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.response).toBe("Respuesta simulada del asistente.");
  });

  it("persists the user message to Supabase messages table", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    const { POST } = await import("@/app/api/chat/route");
    await POST(makeRequest(validBody));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: validBody.chatId,
        user_id: "user-123",
        role: "user",
        content: validBody.message,
      })
    );
  });

  it("returns 429 when rate limit is exhausted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    // The api-handler calls checkRateLimit via @/lib/rateLimit
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      current: 50,
      limit: 50,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
    });
    // Patch the module mock so api-handler picks it up
    const rateLimit = await import("@/lib/rateLimit");
    vi.spyOn(rateLimit, "checkRateLimit").mockResolvedValue({
      allowed: false,
      current: 50,
      limit: 50,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });
});
