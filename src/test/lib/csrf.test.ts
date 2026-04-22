import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { verifyOrigin } from "@/lib/csrf";

function make(method: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/x", {
    method,
    headers,
  });
}

describe("verifyOrigin", () => {
  it("allows safe methods (GET, HEAD, OPTIONS) without any check", () => {
    expect(verifyOrigin(make("GET", { origin: "https://evil.com", host: "localhost" }))).toEqual({
      ok: true,
    });
    expect(verifyOrigin(make("HEAD", { origin: "https://evil.com", host: "localhost" }))).toEqual({
      ok: true,
    });
    expect(
      verifyOrigin(make("OPTIONS", { origin: "https://evil.com", host: "localhost" }))
    ).toEqual({
      ok: true,
    });
  });

  it("allows POST when neither Origin nor Referer present (server-to-server)", () => {
    expect(verifyOrigin(make("POST", { host: "localhost" }))).toEqual({ ok: true });
  });

  it("allows POST when Origin matches Host", () => {
    const res = verifyOrigin(
      make("POST", { origin: "http://localhost:3000", host: "localhost:3000" })
    );
    expect(res).toEqual({ ok: true });
  });

  it("rejects POST when Origin is a different host", () => {
    const res = verifyOrigin(make("POST", { origin: "https://evil.com", host: "localhost:3000" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain("evil.com");
  });

  it("falls back to Referer when Origin is missing", () => {
    const res = verifyOrigin(
      make("POST", { referer: "http://localhost:3000/some/page", host: "localhost:3000" })
    );
    expect(res).toEqual({ ok: true });
  });

  it("rejects malformed Origin header", () => {
    const res = verifyOrigin(make("POST", { origin: "not-a-url", host: "localhost" }));
    expect(res.ok).toBe(false);
  });

  it("rejects when Host is missing but Origin is present", () => {
    const res = verifyOrigin(make("POST", { origin: "http://localhost:3000" }));
    expect(res.ok).toBe(false);
  });

  it("checks PATCH and DELETE methods", () => {
    const badPatch = verifyOrigin(
      make("PATCH", { origin: "https://attacker.com", host: "localhost" })
    );
    expect(badPatch.ok).toBe(false);
    const badDelete = verifyOrigin(
      make("DELETE", { origin: "https://attacker.com", host: "localhost" })
    );
    expect(badDelete.ok).toBe(false);
  });
});
