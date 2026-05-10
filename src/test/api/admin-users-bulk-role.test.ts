import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------- Supabase mock (used by @/utils/supabase/server via requireAdmin) ----------
const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockProfilesUpdate = vi.fn();

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
          update: mockProfilesUpdate,
        };
      }
      return {
        select: () => ({
          eq: () => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        }),
      };
    },
  }),
}));

// ---------- Helper ----------
// For CSRF to pass: do NOT send Origin or Referer (the verifyOrigin function skips check
// when neither header is present — it only enforces when at least one is present).
function makePatchRequest(body: unknown, extraHeaders?: Record<string, string>) {
  return new NextRequest("http://localhost/api/admin/users/bulk-role", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Host: "localhost",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

const ADMIN_ID = "ad000000-0000-0000-0000-000000000001";
const USER_ID_1 = "aa000000-0000-0000-0000-000000000001";
const USER_ID_2 = "aa000000-0000-0000-0000-000000000002";

describe("PATCH /api/admin/users/bulk-role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: ADMIN_ID, email: "admin@test.com" } },
      error: null,
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    // Default: update succeeds
    mockProfilesUpdate.mockReturnValue({
      in: () => ({ error: null, count: 2 }),
    });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(makePatchRequest({ ids: [USER_ID_1], role: "student" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not an admin", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(makePatchRequest({ ids: [USER_ID_1], role: "student" }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 when CSRF check fails (mismatched Origin)", async () => {
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(
      makePatchRequest(
        { ids: [USER_ID_1], role: "student" },
        {
          Origin: "https://evil.example.com",
          Host: "localhost",
        }
      )
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/CSRF/);
  });

  it("returns 200 with success:true on happy path", async () => {
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(makePatchRequest({ ids: [USER_ID_1, USER_ID_2], role: "admin" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(typeof json.updated).toBe("number");
  });

  it("returns 400 when admin tries to bulk-role only themselves", async () => {
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    // ids contains only the admin's own id — should be filtered out → safeIds empty
    const res = await PATCH(makePatchRequest({ ids: [ADMIN_ID], role: "student" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("propio rol");
  });

  it("skips admin own id but updates others", async () => {
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(makePatchRequest({ ids: [ADMIN_ID, USER_ID_1], role: "student" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.skippedSelf).toBe(1);
  });

  it("returns 400 for invalid role value", async () => {
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(makePatchRequest({ ids: [USER_ID_1], role: "superuser" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
  });

  it("returns 400 for empty ids array", async () => {
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(makePatchRequest({ ids: [], role: "student" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
  });

  it("returns 500 when DB update fails", async () => {
    mockProfilesUpdate.mockReturnValue({
      in: () => ({ error: { message: "DB failure" }, count: null }),
    });
    const { PATCH } = await import("@/app/api/admin/users/bulk-role/route");
    const res = await PATCH(makePatchRequest({ ids: [USER_ID_1], role: "admin" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB failure");
  });
});
