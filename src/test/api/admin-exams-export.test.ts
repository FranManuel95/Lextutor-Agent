import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------- Supabase server mock (used by requireAdmin) ----------
const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: mockProfileSingle,
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

// ---------- Supabase admin client mock ----------
// The route builds: .select().order().limit() then optionally chains .eq() calls.
// We use a chainable thenable object so any number of .eq() calls resolves the same mock.

const mockAttemptsResolve = vi.fn();
const mockProfilesInQuery = vi.fn();

function makeChainable(resolveFn: () => Promise<unknown>): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    eq: (_col: string, _val: string) => makeChainable(resolveFn),
    then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      resolveFn().then(resolve, reject),
  };
  return chain;
}

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "exam_attempts") {
        return {
          select: () => ({
            order: () => ({
              limit: () => makeChainable(mockAttemptsResolve),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: mockProfilesInQuery,
          }),
        };
      }
      return {};
    },
  }),
}));

// ---------- Helper ----------
function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/admin/exams/export");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: "GET" });
}

const sampleAttempt = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  user_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  attempt_type: "exam_test",
  area: "civil",
  score: 8,
  status: "finished",
  created_at: "2026-01-10T09:00:00Z",
};

describe("GET /api/admin/exams/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-001", email: "admin@test.com" } },
      error: null,
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    // Default: attempts query returns one row
    mockAttemptsResolve.mockResolvedValue({ data: [sampleAttempt], error: null });
    // Default: profiles lookup returns a name
    mockProfilesInQuery.mockResolvedValue({
      data: [{ id: sampleAttempt.user_id, full_name: "Juan Pérez" }],
      error: null,
    });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not an admin", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns CSV with correct Content-Type on happy path", async () => {
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct).toContain("text/csv");
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
  });

  it("CSV body contains correct header columns", async () => {
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest());
    const body = await res.text();
    expect(body).toContain("id");
    expect(body).toContain("user_id");
    expect(body).toContain("full_name");
    expect(body).toContain("attempt_type");
    expect(body).toContain("area");
    expect(body).toContain("score");
    expect(body).toContain("status");
  });

  it("CSV body contains attempt data rows", async () => {
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest());
    const body = await res.text();
    expect(body).toContain(sampleAttempt.id);
    expect(body).toContain("civil");
    expect(body).toContain("finished");
  });

  it("returns 500 when DB query fails", async () => {
    mockAttemptsResolve.mockResolvedValue({ data: null, error: { message: "DB failure" } });
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB failure");
  });

  it("accepts valid area filter and returns CSV", async () => {
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest({ area: "laboral" }));
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct).toContain("text/csv");
  });

  it("ignores invalid area filter and still returns CSV", async () => {
    const { GET } = await import("@/app/api/admin/exams/export/route");
    const res = await GET(makeGetRequest({ area: "invalid-area" }));
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct).toContain("text/csv");
  });
});
