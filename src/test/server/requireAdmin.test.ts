import { describe, it, expect, beforeEach, vi } from "vitest";

const mockGetUser = vi.fn();
const mockFromSingle = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockFromSingle,
        }),
      }),
    }),
  }),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFromSingle.mockReset();
  });

  it("throws 'Unauthorized' when no user session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { requireAdmin } = await import("@/server/security/requireAdmin");
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws auth error message when getUser fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "token expired" } });
    const { requireAdmin } = await import("@/server/security/requireAdmin");
    await expect(requireAdmin()).rejects.toThrow("token expired");
  });

  it("throws 'Forbidden' when profile missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFromSingle.mockResolvedValue({ data: null, error: null });
    const { requireAdmin } = await import("@/server/security/requireAdmin");
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("throws 'Forbidden' when role is not 'admin'", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFromSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    const { requireAdmin } = await import("@/server/security/requireAdmin");
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("throws 'Forbidden' when role field shape is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFromSingle.mockResolvedValue({ data: { role: 42 }, error: null });
    const { requireAdmin } = await import("@/server/security/requireAdmin");
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("returns supabase + user when role === 'admin'", async () => {
    const user = { id: "u1", email: "a@b.c" };
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockFromSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    const { requireAdmin } = await import("@/server/security/requireAdmin");
    const result = await requireAdmin();
    expect(result.user).toEqual(user);
    expect(result.supabase).toBeDefined();
  });
});
