import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock @/lib/supabase ──────────────────────────────────────────────────────
const mockAuthResend = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        resend: mockAuthResend,
      },
    })
  ),
}));

// ─── Mock @/lib/rateLimit ─────────────────────────────────────────────────────
const mockCheckRateLimit = vi.fn();

vi.mock("@/lib/rateLimit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rateLimit")>();
  return {
    ...actual,
    checkRateLimit: mockCheckRateLimit,
  };
});

// ─── Mock @/lib/logger ────────────────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/resend-verification", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuthResend.mockReset();
    mockCheckRateLimit.mockReset();
  });

  it("returns 400 for an invalid email address", async () => {
    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 for a missing email field", async () => {
    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      current: 3,
      limit: 3,
      resetAt: new Date().toISOString(),
    });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many/i);
  });

  it("returns 200 and success message on valid email within rate limit", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      current: 1,
      limit: 3,
      resetAt: new Date().toISOString(),
    });
    mockAuthResend.mockResolvedValue({ error: null });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/sent/i);
  });

  it("returns 400 when supabase auth.resend returns an error", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      current: 1,
      limit: 3,
      resetAt: new Date().toISOString(),
    });
    mockAuthResend.mockResolvedValue({ error: { message: "User not found" } });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("User not found");
  });

  it("returns 500 when supabase throws an unexpected error", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      current: 1,
      limit: 3,
      resetAt: new Date().toISOString(),
    });
    mockAuthResend.mockRejectedValue(new Error("connection timeout"));

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
