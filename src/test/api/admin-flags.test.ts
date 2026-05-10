import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------- Supabase mock (used by @/utils/supabase/server via requireAdmin) ----------
const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockFlagUpdate = vi.fn();

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
          update: mockFlagUpdate,
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
function makePatchRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/admin/flags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const flagId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("PATCH /api/admin/flags/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
      error: null,
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    // Default: flag update succeeds
    mockFlagUpdate.mockReturnValue({
      eq: () => ({ error: null }),
    });
  });

  it("returns 403 when user is not an admin", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    const { PATCH } = await import("@/app/api/admin/flags/[id]/route");
    const res = await PATCH(makePatchRequest(flagId, { status: "reviewed" }), {
      params: Promise.resolve({ id: flagId }),
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 200 with success:true when status is updated", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/[id]/route");
    const res = await PATCH(makePatchRequest(flagId, { status: "reviewed" }), {
      params: Promise.resolve({ id: flagId }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 for invalid body (unknown status value)", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/[id]/route");
    const res = await PATCH(makePatchRequest(flagId, { status: "invalid-status" }), {
      params: Promise.resolve({ id: flagId }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation Error");
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { PATCH } = await import("@/app/api/admin/flags/[id]/route");
    const res = await PATCH(makePatchRequest(flagId, { status: "reviewed" }), {
      params: Promise.resolve({ id: flagId }),
    });
    // requireAdmin throws "Unauthorized" → mapped to 401
    expect(res.status).toBe(401);
  });
});
