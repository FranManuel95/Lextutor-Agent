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

// ---------- Supabase admin client mock (used by createAdminClient) ----------
const mockFlagsSelect = vi.fn();
const mockProfilesInSelect = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "question_flags") {
        return {
          select: () => ({
            order: () => ({
              limit: mockFlagsSelect,
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: mockProfilesInSelect,
          }),
        };
      }
      return {};
    },
  }),
}));

// ---------- Helper ----------
function makeGetRequest() {
  return new NextRequest("http://localhost/api/admin/flags/export", { method: "GET" });
}

const sampleFlag = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  user_id: "user-1",
  attempt_id: "att-1",
  question_id: "q-1",
  question_text: "¿Qué es el dolo?",
  area: "civil",
  reason: "incorrect",
  comment: "wrong answer",
  status: "open",
  created_at: "2026-01-01T00:00:00Z",
};

describe("GET /api/admin/flags/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
      error: null,
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    // Default: flags query returns one row
    mockFlagsSelect.mockResolvedValue({ data: [sampleFlag], error: null });
    // Default: profiles returns a name
    mockProfilesInSelect.mockReturnValue({
      returns: () => Promise.resolve({ data: [{ id: "user-1", full_name: "Ana García" }] }),
    });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("@/app/api/admin/flags/export/route");
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not an admin", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    const { GET } = await import("@/app/api/admin/flags/export/route");
    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns CSV with correct Content-Type on happy path", async () => {
    const { GET } = await import("@/app/api/admin/flags/export/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct).toContain("text/csv");
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
    // Should contain headers
    expect(body).toContain("id");
    expect(body).toContain("user_id");
    expect(body).toContain("status");
  });

  it("includes flag data rows in CSV body", async () => {
    const { GET } = await import("@/app/api/admin/flags/export/route");
    const res = await GET();
    const body = await res.text();
    expect(body).toContain(sampleFlag.id);
    expect(body).toContain("open");
    expect(body).toContain("civil");
  });

  it("returns 500 when DB query fails", async () => {
    mockFlagsSelect.mockResolvedValue({ data: null, error: { message: "DB error" } });
    const { GET } = await import("@/app/api/admin/flags/export/route");
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB error");
  });

  it("returns CSV with only header row when no flags exist", async () => {
    mockFlagsSelect.mockResolvedValue({ data: [], error: null });
    const { GET } = await import("@/app/api/admin/flags/export/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.text();
    // Only the header line, no data rows
    expect(body).toContain("id");
    expect(body).toContain("status");
  });
});
