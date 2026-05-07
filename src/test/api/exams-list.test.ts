import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCreateClient = vi.fn();
const mockCheckRateLimit = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  RATE_LIMITS: {
    EXAMS_LIST: { endpoint: "/api/exams", limit: 120, windowMinutes: 60 },
  },
}));

const MOCK_EXAMS = [
  {
    id: "att-1",
    user_id: "user-test",
    attempt_type: "quiz",
    area: "civil",
    score: 8.5,
    status: "finished",
    created_at: "2026-02-10T10:00:00Z",
  },
  {
    id: "att-2",
    user_id: "user-test",
    attempt_type: "exam_open",
    area: "laboral",
    score: 7.0,
    status: "finished",
    created_at: "2026-02-09T09:00:00Z",
  },
];

const MOCK_STATS = {
  streak: 3,
  longestStreak: 7,
  lastActive: "2026-02-10",
  averages: { byType: { quiz: 8.5 }, byArea: { civil: 8.5 } },
};

function buildSupabaseClient({
  user,
  items = MOCK_EXAMS,
  count = MOCK_EXAMS.length,
  queryError = null,
  stats = MOCK_STATS,
}: {
  user: { id: string } | null;
  items?: any[];
  count?: number;
  queryError?: any;
  stats?: any;
}) {
  // Build a chainable query mock for exam_attempts.
  // After .range() the Supabase builder is still chainable (additional .eq() calls for
  // type/area/status filters), so every step must return a thenable+chainable object.
  const resolvedData = { data: items, count, error: queryError };

  function makeQueryChain(): any {
    return {
      eq: vi.fn((_field: string, _value: unknown) => makeQueryChain()),
      order: vi.fn(() => makeQueryChain()),
      range: vi.fn(() => makeQueryChain()),
      then: (resolve: (v: any) => any) => Promise.resolve(resolvedData).then(resolve),
      catch: (reject: (e: any) => any) => Promise.resolve(resolvedData).catch(reject),
    };
  }

  const selectMock = vi.fn(() => makeQueryChain());

  const rpcMock = vi.fn().mockResolvedValue({ data: stats, error: null });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "exam_attempts") {
        return { select: selectMock };
      }
      return {};
    }),
    rpc: rpcMock,
  };
}

function makeRequest(queryString = "") {
  return new NextRequest(`http://localhost/api/exams${queryString}`);
}

describe("GET /api/exams", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
    mockCheckRateLimit.mockReset();
    // Default: rate limit allowed
    mockCheckRateLimit.mockResolvedValue({ allowed: true, current: 1, limit: 120, resetAt: "" });
  });

  it("returns 200 with paginated exam list and stats", async () => {
    const client = buildSupabaseClient({ user: { id: "user-test" } });
    mockCreateClient.mockResolvedValue(client);

    const { GET } = await import("@/app/api/exams/route");
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(2);
    expect(body.count).toBe(2);
    expect(body.stats.streak).toBe(3);
    expect(body.stats.longestStreak).toBe(7);
  });

  it("returns 401 when user is not authenticated", async () => {
    const client = buildSupabaseClient({ user: null });
    mockCreateClient.mockResolvedValue(client);

    const { GET } = await import("@/app/api/exams/route");
    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 filtering by type=quiz and area=laboral query params", async () => {
    const filteredExams = MOCK_EXAMS.filter(
      (e) => e.attempt_type === "quiz" && e.area === "laboral"
    );

    // Build a more flexible mock that records the eq calls for assertions
    const rangeResult = { data: filteredExams, count: filteredExams.length, error: null };

    const eqMocks: Array<{ field: string; value: string }> = [];

    // makeChain returns a chainable object. After .range() is called, additional .eq()
    // calls can still be made (Supabase PostgREST builder is fully chainable at every step).
    // The chain resolves to rangeResult when awaited (Promise.resolve thenable).
    function makeChain(): any {
      const chain: any = {
        eq: (field: string, value: string) => {
          eqMocks.push({ field, value });
          return makeChain();
        },
        order: () => makeChain(),
        range: () => makeChain(),
        then: (resolve: (v: any) => any) => Promise.resolve(rangeResult).then(resolve),
        catch: (reject: (e: any) => any) => Promise.resolve(rangeResult).catch(reject),
      };
      return chain;
    }

    const rpcMock = vi.fn().mockResolvedValue({ data: MOCK_STATS, error: null });

    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-test" } } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => makeChain()),
      })),
      rpc: rpcMock,
    };

    mockCreateClient.mockResolvedValue(client);

    const { GET } = await import("@/app/api/exams/route");
    const res = await GET(makeRequest("?type=quiz&area=laboral"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);

    // Verify that the filters were applied in the query chain
    const fields = eqMocks.map((m) => m.field);
    const values = eqMocks.map((m) => m.value);
    expect(fields).toContain("attempt_type");
    expect(values).toContain("quiz");
    expect(fields).toContain("area");
    expect(values).toContain("laboral");
  });
});
