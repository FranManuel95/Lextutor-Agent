import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------- Supabase server mock (used by createServerClient for auth) ----------
const mockGetUser = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

// ---------- Rate limit mock ----------
const mockCheckRateLimit = vi.fn();

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  RATE_LIMITS: {
    AUDIO_UPLOAD_URL: { endpoint: "/api/audio/create-upload", limit: 30, windowMinutes: 60 },
  },
}));

// ---------- @supabase/supabase-js admin client mock ----------
// The route calls createClient from @supabase/supabase-js to build an admin client.
const mockCreateSignedUploadUrl = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
      }),
    },
  }),
}));

// ---------- Helper ----------
function makePostRequest() {
  return new NextRequest("http://localhost/api/audio/create-upload", { method: "POST" });
}

const MOCK_USER = { id: "user-aaaa-aaaa-aaaa-aaaaaaaaaaaa", email: "student@test.com" };

describe("POST /api/audio/create-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid authenticated user
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null });
    // Default: rate limit allows the request
    mockCheckRateLimit.mockResolvedValue({ allowed: true, current: 1, limit: 30, resetAt: "" });
    // Default: storage returns a signed URL
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: "https://storage.example.com/signed?token=abc123",
        token: "abc123",
      },
      error: null,
    });
  });

  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("@/app/api/audio/create-upload/route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when auth returns an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("auth error"),
    });
    const { POST } = await import("@/app/api/audio/create-upload/route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      current: 30,
      limit: 30,
      resetAt: new Date().toISOString(),
    });
    const { POST } = await import("@/app/api/audio/create-upload/route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("Too many upload requests.");
  });

  it("returns 200 with path, signedUrl, and token on happy path", async () => {
    const { POST } = await import("@/app/api/audio/create-upload/route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.path).toBe("string");
    expect(json.path).toContain(MOCK_USER.id);
    expect(json.path).toMatch(/\.webm$/);
    expect(typeof json.signedUrl).toBe("string");
    expect(typeof json.token).toBe("string");
  });

  it("returns 500 when storage createSignedUploadUrl fails", async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: null,
      error: new Error("storage failure"),
    });
    const { POST } = await import("@/app/api/audio/create-upload/route");
    const res = await POST(makePostRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to create upload URL");
  });
});
