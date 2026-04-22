import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const { mockGetUser, mockFromSelect, mockCheckRateLimit } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFromSelect: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: mockFromSelect,
          }),
        }),
      }),
    }),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

import { createApiHandler } from "@/lib/api-handler";

function makeRequest(body?: object, method = "POST") {
  return new NextRequest("http://localhost/api/test", {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createApiHandler", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFromSelect.mockReset();
    mockCheckRateLimit.mockReset();
  });

  it("returns 401 when no user session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const handler = createApiHandler(async () => ({ ok: true }));
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns result wrapped in JSON on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const handler = createApiHandler(async () => ({ hello: "mundo" }));
    const res = await handler(makeRequest({ anything: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hello: "mundo" });
  });

  it("returns NextResponse directly when handler returns one", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const handler = createApiHandler(async () =>
      NextResponse.json({ custom: true }, { status: 202 })
    );
    const res = await handler(makeRequest({ anything: true }));
    expect(res.status).toBe(202);
  });

  it("returns 400 with Zod details when body fails validation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const schema = z.object({ name: z.string() });
    const handler = createApiHandler(async () => ({}), { schema });
    const res = await handler(makeRequest({ name: 123 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation Error");
    expect(Array.isArray(body.details)).toBe(true);
  });

  it("rejects unknown fields when schema is strict", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const schema = z.object({ name: z.string() }).strict();
    const handler = createApiHandler(async () => ({}), { schema });
    const res = await handler(makeRequest({ name: "ok", role: "admin" }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when requireAdmin fails (role is student)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFromSelect.mockResolvedValue({ data: { role: "student" }, error: null });
    const handler = createApiHandler(async () => ({ ok: true }), { requireAdmin: true });
    const res = await handler(makeRequest({ x: 1 }));
    expect(res.status).toBe(403);
  });

  it("returns 200 when requireAdmin passes (role is admin)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFromSelect.mockResolvedValue({ data: { role: "admin" }, error: null });
    const handler = createApiHandler(async () => ({ ok: true }), { requireAdmin: true });
    const res = await handler(makeRequest({ x: 1 }));
    expect(res.status).toBe(200);
  });

  it("returns 403 when requireAdmin fails (profile is null)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFromSelect.mockResolvedValue({ data: null, error: null });
    const handler = createApiHandler(async () => ({ ok: true }), { requireAdmin: true });
    const res = await handler(makeRequest({ x: 1 }));
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      resetAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const handler = createApiHandler(async () => ({ ok: true }), {
      rateLimit: { endpoint: "/api/test", limit: 10, windowMinutes: 60 },
    });
    const res = await handler(makeRequest({ x: 1 }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.resetAt).toBeDefined();
  });

  it("calls handler when rate limit is allowed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    const handler = createApiHandler(async () => ({ passed: true }), {
      rateLimit: { endpoint: "/api/test", limit: 10, windowMinutes: 60 },
    });
    const res = await handler(makeRequest({ x: 1 }));
    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected handler error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const handler = createApiHandler(async () => {
      throw new Error("algo explotó");
    });
    const res = await handler(makeRequest({ x: 1 }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("algo explotó");
  });

  it("does not parse body for GET requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const spy = vi.fn().mockResolvedValue({ data: "ok" });
    const handler = createApiHandler(spy);
    const req = new NextRequest("http://localhost/api/test", { method: "GET" });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ body: {}, user: expect.any(Object) })
    );
  });
});
