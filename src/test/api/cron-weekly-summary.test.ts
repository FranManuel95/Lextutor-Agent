import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock @/lib/env ───────────────────────────────────────────────────────────
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    GEMINI_API_KEY: "test-gemini-key",
    AI_PROVIDER: "gemini",
    CRON_SECRET: "test-secret-16chars",
  },
}));

// ─── Mock @/utils/supabase/admin ──────────────────────────────────────────────
const mockProfilesSelect = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: mockProfilesSelect,
      })),
    })),
  })),
}));

// ─── Mock @/lib/logger ────────────────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(opts: { authHeader?: string; token?: string } = {}): NextRequest {
  const url = new URL("http://localhost/api/cron/weekly-summary");
  if (opts.token) url.searchParams.set("token", opts.token);

  const headers: Record<string, string> = {};
  if (opts.authHeader) headers["authorization"] = opts.authHeader;

  return new NextRequest(url.toString(), { method: "GET", headers });
}

describe("GET /api/cron/weekly-summary", () => {
  beforeEach(() => {
    vi.resetModules();
    mockProfilesSelect.mockReset();
  });

  it("returns 401 when no authorization header and no token query param", async () => {
    const { GET } = await import("@/app/api/cron/weekly-summary/route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 401 when the Bearer token is incorrect", async () => {
    const { GET } = await import("@/app/api/cron/weekly-summary/route");
    const res = await GET(makeRequest({ authHeader: "Bearer wrong-token" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when the query param token is incorrect", async () => {
    const { GET } = await import("@/app/api/cron/weekly-summary/route");
    const res = await GET(makeRequest({ token: "bad-token" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 with processed count when Bearer token is correct", async () => {
    mockProfilesSelect.mockResolvedValue({
      data: [
        { id: "u1", email: "a@test.com" },
        { id: "u2", email: "b@test.com" },
      ],
      error: null,
    });

    const { GET } = await import("@/app/api/cron/weekly-summary/route");
    const res = await GET(makeRequest({ authHeader: "Bearer test-secret-16chars" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(2);
  });

  it("returns 200 when query param token is correct", async () => {
    mockProfilesSelect.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/cron/weekly-summary/route");
    const res = await GET(makeRequest({ token: "test-secret-16chars" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(0);
  });

  it("returns 500 when Supabase query fails", async () => {
    mockProfilesSelect.mockResolvedValue({
      data: null,
      error: { message: "database error" },
    });

    const { GET } = await import("@/app/api/cron/weekly-summary/route");
    const res = await GET(makeRequest({ authHeader: "Bearer test-secret-16chars" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
