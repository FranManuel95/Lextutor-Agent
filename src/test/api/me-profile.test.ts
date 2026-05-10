import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSupabaseFrom = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createApiHandler: (handler: any, options: any) => async (request: NextRequest) => {
    const { NextResponse } = await import("next/server");
    const { z } = await import("zod");
    try {
      let body = {};
      if (request.method !== "GET" && request.method !== "DELETE") {
        const json = await request.json();
        body = options?.schema ? options.schema.parse(json) : json;
      }
      const result = await handler({
        user: { id: "user-test" },
        supabase: { from: mockSupabaseFrom },
        body,
      });
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result);
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation Error", details: e.errors }, { status: 400 });
      }
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Internal Server Error" },
        { status: 500 }
      );
    }
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
  RATE_LIMITS: {},
}));

function makeGetRequest() {
  return new NextRequest("http://localhost/api/me/profile", {
    method: "GET",
  });
}

function makePatchRequest(body: object) {
  return new NextRequest("http://localhost/api/me/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const MOCK_PROFILE = {
  full_name: "Ana García",
  avatar_url: null,
  birth_date: "1990-05-15",
  age: 35,
  role: "student",
  email_weekly_summary: true,
};

describe("GET /api/me/profile", () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
  });

  it("returns 200 with the user profile", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: MOCK_PROFILE, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const { GET } = await import("@/app/api/me/profile/route");
    const res = await GET(makeGetRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.full_name).toBe("Ana García");
    expect(body.role).toBe("student");
    expect(body.email_weekly_summary).toBe(true);
  });

  it("returns 500 when Supabase returns an error", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: null, error: { message: "DB connection error" } }),
            }),
          }),
        };
      }
      return {};
    });

    const { GET } = await import("@/app/api/me/profile/route");
    const res = await GET(makeGetRequest());

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB connection error");
  });
});

describe("PATCH /api/me/profile", () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
  });

  it("returns 200 with updated data on valid body", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    const { PATCH } = await import("@/app/api/me/profile/route");
    const res = await PATCH(
      makePatchRequest({ full_name: "Juan López", email_weekly_summary: false })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.full_name).toBe("Juan López");
    expect(body.user.email_weekly_summary).toBe(false);
  });

  it("returns 400 when full_name is too short (Zod min 2)", async () => {
    const { PATCH } = await import("@/app/api/me/profile/route");
    const res = await PATCH(makePatchRequest({ full_name: "x" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation Error");
    expect(Array.isArray(body.details)).toBe(true);
  });

  it("returns 400 when body contains an unknown field (schema is .strict())", async () => {
    const { PATCH } = await import("@/app/api/me/profile/route");
    const res = await PATCH(makePatchRequest({ full_name: "Ana García", role: "admin" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation Error");
  });
});
