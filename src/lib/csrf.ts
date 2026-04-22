import { NextRequest } from "next/server";

/**
 * Verifies the Origin (or fallback Referer) of a state-changing request
 * matches the Host header. This prevents CSRF from third-party domains
 * even when the browser sends auth cookies.
 *
 * Safe methods (GET, HEAD, OPTIONS) are not checked — they should never
 * mutate state anyway, and skipping them avoids breaking prefetches.
 *
 * Same-origin browser requests always send Origin (post-Fetch spec).
 * Server-to-server calls (cron, internal APIs using service role) use
 * bearer auth and may not include Origin; they're caught separately by
 * the auth layer and don't need CSRF.
 */
export function verifyOrigin(request: NextRequest): { ok: true } | { ok: false; reason: string } {
  const method = request.method.toUpperCase();
  // Only check state-changing methods.
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { ok: true };
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Some automated tools / cron calls don't send Origin. We only enforce
  // the check when at least Origin or Referer is present — otherwise we
  // rely purely on the auth layer.
  if (!origin && !referer) {
    return { ok: true };
  }

  if (!host) {
    return { ok: false, reason: "Missing Host header" };
  }

  // Extract origin from whichever header is present
  const urlStr = origin ?? referer ?? "";
  let sourceHost: string;
  try {
    sourceHost = new URL(urlStr).host;
  } catch {
    return { ok: false, reason: "Malformed Origin/Referer" };
  }

  // Allow an explicit whitelist for known deploy URLs (Vercel previews, etc.)
  const extra = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedHosts = new Set<string>([
    host,
    ...extra.map((u) => {
      try {
        return new URL(u).host;
      } catch {
        return u;
      }
    }),
  ]);

  if (!allowedHosts.has(sourceHost)) {
    return { ok: false, reason: `Origin '${sourceHost}' not allowed` };
  }

  return { ok: true };
}
