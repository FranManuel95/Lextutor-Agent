import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env validation", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("loads env successfully when all required vars are present", async () => {
    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://localhost:54321");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("test-service-role-key");
    expect(env.GEMINI_API_KEY).toBe("test-gemini-key");
  });

  it("defaults AI_PROVIDER to 'gemini'", async () => {
    delete process.env.AI_PROVIDER;
    vi.resetModules();
    const { env } = await import("@/lib/env");
    expect(env.AI_PROVIDER).toBe("gemini");
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.resetModules();
    await expect(import("@/lib/env")).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    vi.resetModules();
    await expect(import("@/lib/env")).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejects invalid AI_PROVIDER values", async () => {
    process.env.AI_PROVIDER = "claude";
    vi.resetModules();
    await expect(import("@/lib/env")).rejects.toThrow(/AI_PROVIDER/);
  });
});
