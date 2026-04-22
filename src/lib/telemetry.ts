/**
 * Telemetry wrapper — a thin abstraction in front of an eventual error
 * tracking provider (Sentry / Highlight / Datadog RUM / etc). Today it just
 * logs via the existing structured logger so errors are visible in Vercel
 * logs. When we bolt on a real provider, this is the single file that
 * changes — no call sites need updating.
 *
 * Design goals:
 *  - No runtime dependency today (works without `npm install`)
 *  - Safe to import from server and client without duplicating code
 *  - Matches common provider APIs so the swap is mostly drop-in
 */

import { logger } from "./logger";

export type TelemetryTags = Record<string, string | number | boolean | undefined>;

export type TelemetryContext = {
  user?: { id: string; email?: string };
  extra?: Record<string, unknown>;
  tags?: TelemetryTags;
};

// Set this to true from an init hook (app/layout, instrumentation) once a
// real provider is wired up, so we don't double-log through the fallback.
let providerInitialized = false;

export function markTelemetryProviderInitialized() {
  providerInitialized = true;
}

/**
 * Captures an unexpected error. Call this in catch blocks where the error
 * is already handled locally but should still be reported.
 */
export function captureException(error: unknown, context?: TelemetryContext): void {
  if (providerInitialized) {
    // Placeholder: when Sentry is wired, do `Sentry.captureException(error, {...})`.
    // For now we still want the log trail, so fall through.
  }
  logger.error("exception captured", error, {
    ...(context?.tags ?? {}),
    ...(context?.extra ?? {}),
    userId: context?.user?.id,
  });
}

/**
 * Captures a non-error event (useful for unexpected-but-recoverable flows).
 */
export function captureMessage(
  message: string,
  level: "info" | "warn" | "error" = "info",
  context?: TelemetryContext
): void {
  const meta = {
    ...(context?.tags ?? {}),
    ...(context?.extra ?? {}),
    ...(context?.user ? { userId: context.user.id } : {}),
  };
  if (level === "error") {
    logger.error(message, undefined, meta);
  } else if (level === "warn") {
    logger.warn(message, meta);
  } else {
    logger.info(message, meta);
  }
}

/**
 * Attaches user context so subsequent error reports include identity.
 * Server-side: call per request. Client-side: call on login/session ready.
 */
export function setTelemetryUser(user: { id: string; email?: string } | null): void {
  if (providerInitialized) {
    // Placeholder: `Sentry.setUser(user ?? null)`
  }
  // No-op in the fallback — logger includes userId per call instead.
  void user;
}

/**
 * Wraps a promise-returning function, auto-reporting rejections.
 * Useful for fire-and-forget background work where you don't await.
 */
export function withTelemetry<T>(
  label: string,
  fn: () => Promise<T>,
  context?: TelemetryContext
): Promise<T> {
  return fn().catch((err) => {
    captureException(err, { ...context, tags: { ...(context?.tags ?? {}), label } });
    throw err;
  });
}
