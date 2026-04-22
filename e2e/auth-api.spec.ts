import { test, expect } from "@playwright/test";

/**
 * API-level checks for auth-gated routes.
 * Verifies that protected endpoints reject unauthenticated requests with 401
 * (and not 500 / default error / success).
 */

test.describe("API auth gates", () => {
  test("GET /api/rag/documents rejects unauthenticated with 401/403", async ({ request }) => {
    const res = await request.get("/api/rag/documents");
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/audio/create-upload rejects unauthenticated with 401", async ({ request }) => {
    const res = await request.post("/api/audio/create-upload");
    expect(res.status()).toBe(401);
  });

  test("POST /api/auth/resend-verification validates body with 400", async ({ request }) => {
    const res = await request.post("/api/auth/resend-verification", {
      data: { email: "not-an-email" },
    });
    expect(res.status()).toBe(400);
  });
});
