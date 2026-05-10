import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------- Supabase mock (used by @/utils/supabase/server) ----------
const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockProfileUpdate = vi.fn();
const mockRpc = vi.fn();

function makeProfileQueryBuilder() {
  const builder: Record<string, unknown> = {};
  builder["select"] = () => builder;
  builder["eq"] = () => builder;
  builder["single"] = mockProfileSingle;
  builder["update"] = () => ({
    eq: () => ({ error: null }),
  });
  return builder;
}

const mockFrom = vi.fn(() => makeProfileQueryBuilder());

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

// ---------- Rate limit mock (me/settings PATCH calls checkRateLimit) ----------
const mockCheckRateLimit = vi.fn();
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  RATE_LIMITS: {
    SETTINGS_UPDATE: { endpoint: "/api/me/settings", limit: 20, windowMinutes: 60 },
  },
}));

// ---------- Helpers ----------
function makeGetRequest() {
  return new NextRequest("http://localhost/api/me/settings", { method: "GET" });
}

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/me/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/me/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("@/app/api/me/settings/route");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 200 with the user's tutor_prefs", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-456" } }, error: null });
    mockProfileSingle.mockResolvedValue({
      data: { tutor_prefs: { area: "laboral", modes: ["concise"], detailLevel: "brief" } },
      error: null,
    });
    const { GET } = await import("@/app/api/me/settings/route");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.area).toBe("laboral");
    expect(json.modes).toEqual(["concise"]);
    expect(json.detailLevel).toBe("brief");
  });

  it("returns default settings when profile has no tutor_prefs", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-456" } }, error: null });
    mockProfileSingle.mockResolvedValue({ data: { tutor_prefs: null }, error: null });
    const { GET } = await import("@/app/api/me/settings/route");
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.area).toBe("otro");
    expect(json.modes).toEqual([]);
    expect(json.detailLevel).toBe("normal");
  });
});

describe("PATCH /api/me/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      current: 1,
      limit: 20,
      resetAt: new Date().toISOString(),
    });
    // Default: fetch returns existing prefs, update succeeds
    mockProfileSingle.mockResolvedValue({
      data: { tutor_prefs: { area: "civil", modes: [], detailLevel: "normal" } },
      error: null,
    });
    // Rebuild mockFrom to handle update chain for PATCH tests
    mockFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: mockProfileSingle,
        }),
      }),
      update: mockProfileUpdate,
    }));
    mockProfileUpdate.mockReturnValue({
      eq: () => ({ error: null }),
    });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { PATCH } = await import("@/app/api/me/settings/route");
    const res = await PATCH(makePatchRequest({ area: "laboral" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid body (Zod validation error)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-456" } }, error: null });
    const { PATCH } = await import("@/app/api/me/settings/route");
    // "area" must be one of the defined enum values
    const res = await PATCH(makePatchRequest({ area: "invalid-area" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
    expect(json.details).toBeDefined();
  });

  it("returns 200 and merged prefs after a valid PATCH", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-456" } }, error: null });
    const { PATCH } = await import("@/app/api/me/settings/route");
    const res = await PATCH(makePatchRequest({ area: "laboral", detailLevel: "extended" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    // Merged: existing civil→laboral override, extended override
    expect(json.area).toBe("laboral");
    expect(json.detailLevel).toBe("extended");
  });
});
