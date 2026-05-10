import { describe, it, expect, beforeEach, vi } from "vitest";

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
const mockProfilesSelect = vi.fn();
const mockListUsers = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: mockProfilesSelect,
        };
      }
      return {};
    },
    auth: {
      admin: {
        listUsers: mockListUsers,
      },
    },
  }),
}));

const sampleProfile = {
  id: "user-1111-aaaa-aaaa-aaaaaaaaaaaa",
  full_name: "María López",
  role: "student",
  created_at: "2026-01-15T10:00:00Z",
};

const sampleAuthUser = {
  id: "user-1111-aaaa-aaaa-aaaaaaaaaaaa",
  email: "maria@test.com",
};

describe("GET /api/admin/users/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
      error: null,
    });
    mockProfileSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    // Default: profiles query returns one row
    mockProfilesSelect.mockResolvedValue({ data: [sampleProfile], error: null });
    // Default: auth.admin.listUsers returns one auth user
    mockListUsers.mockResolvedValue({ data: { users: [sampleAuthUser] }, error: null });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("@/app/api/admin/users/export/route");
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not an admin", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    const { GET } = await import("@/app/api/admin/users/export/route");
    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns CSV with correct Content-Type on happy path", async () => {
    const { GET } = await import("@/app/api/admin/users/export/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct).toContain("text/csv");
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
  });

  it("CSV body contains header columns", async () => {
    const { GET } = await import("@/app/api/admin/users/export/route");
    const res = await GET();
    const body = await res.text();
    expect(body).toContain("id");
    expect(body).toContain("full_name");
    expect(body).toContain("email");
    expect(body).toContain("role");
  });

  it("CSV body contains user data rows", async () => {
    const { GET } = await import("@/app/api/admin/users/export/route");
    const res = await GET();
    const body = await res.text();
    expect(body).toContain(sampleProfile.id);
    expect(body).toContain("María López");
    expect(body).toContain("maria@test.com");
    expect(body).toContain("student");
  });

  it("returns 500 when profiles DB query fails", async () => {
    mockProfilesSelect.mockResolvedValue({ data: null, error: { message: "DB error" } });
    const { GET } = await import("@/app/api/admin/users/export/route");
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB error");
  });

  it("returns CSV with only header row when no users exist", async () => {
    mockProfilesSelect.mockResolvedValue({ data: [], error: null });
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });
    const { GET } = await import("@/app/api/admin/users/export/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct).toContain("text/csv");
  });
});
