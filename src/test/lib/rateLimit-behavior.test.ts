import { describe, it, expect, beforeEach, vi } from "vitest";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

describe("checkRateLimit fail-closed behavior", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("returns allowed:true when RPC returns allowed:true", async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        current: 5,
        limit: 50,
        resetAt: new Date().toISOString(),
      },
      error: null,
    });
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rateLimit");
    const result = await checkRateLimit("user-1", RATE_LIMITS.CHAT);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(5);
  });

  it("returns allowed:false when RPC returns allowed:false", async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: false,
        current: 50,
        limit: 50,
        resetAt: new Date().toISOString(),
      },
      error: null,
    });
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rateLimit");
    const result = await checkRateLimit("user-1", RATE_LIMITS.CHAT);
    expect(result.allowed).toBe(false);
  });

  it("FAILS CLOSED: returns allowed:false when RPC errors out", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "database connection lost" },
    });
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rateLimit");
    const result = await checkRateLimit("user-1", RATE_LIMITS.CHAT);
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(RATE_LIMITS.CHAT.limit);
    expect(result.limit).toBe(RATE_LIMITS.CHAT.limit);
  });

  it("passes the correct RPC parameters", async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: true, current: 0, limit: 10, resetAt: "" },
      error: null,
    });
    const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rateLimit");
    await checkRateLimit("user-abc", RATE_LIMITS.EXAM_GENERATE);
    expect(mockRpc).toHaveBeenCalledWith("check_rate_limit", {
      p_user_id: "user-abc",
      p_endpoint: "/api/exam/generate",
      p_limit: 10,
      p_window_minutes: 1440,
    });
  });
});
