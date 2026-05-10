import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------- Supabase mock (used by @/utils/supabase/server via requireAdmin) ----------
const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockFlagsUpdate = vi.fn();

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
      if (table === "question_flags") {
        return {
          update: mockFlagsUpdate,
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

// ---------- Helpers ----------
function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/flags/bulk", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validIds = ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"];

describe("PATCH /api/admin/flags/bulk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
      error: null,
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    // Default: update succeeds
    mockFlagsUpdate.mockReturnValue({
      in: () => ({ error: null, count: 2 }),
    });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { PATCH } = await import("@/app/api/admin/flags/bulk/route");
    const res = await PATCH(makePatchRequest({ ids: validIds, status: "reviewed" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not an admin", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    const { PATCH } = await import("@/app/api/admin/flags/bulk/route");
    const res = await PATCH(makePatchRequest({ ids: validIds, status: "reviewed" }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 200 with success:true and updated count on happy path", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/bulk/route");
    const res = await PATCH(makePatchRequest({ ids: validIds, status: "reviewed" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(typeof json.updated).toBe("number");
  });

  it("returns 400 for invalid status value", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/bulk/route");
    const res = await PATCH(makePatchRequest({ ids: validIds, status: "invalid-status" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
  });

  it("returns 400 when ids array is empty", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/bulk/route");
    const res = await PATCH(makePatchRequest({ ids: [], status: "reviewed" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
  });

  it("returns 400 when ids are not valid UUIDs", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/bulk/route");
    const res = await PATCH(makePatchRequest({ ids: ["not-a-uuid"], status: "dismissed" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
  });

  it("returns 500 when DB update fails", async () => {
    mockFlagsUpdate.mockReturnValue({
      in: () => ({ error: { message: "DB failure" }, count: null }),
    });
    const { PATCH } = await import("@/app/api/admin/flags/bulk/route");
    const res = await PATCH(makePatchRequest({ ids: validIds, status: "dismissed" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB failure");
  });
});
