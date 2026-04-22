/**
 * Zero-dep structured logger.
 *
 * - Production: single-line JSON for easy aggregation (Vercel/Datadog/etc)
 * - Development: pretty console output (preserves local DX)
 * - Redacts common sensitive keys before output (tokens, passwords, keys)
 */

type Level = "info" | "warn" | "error";

type Meta = Record<string, unknown>;

const REDACT_KEYS = new Set([
  "password",
  "passwd",
  "token",
  "apiKey",
  "api_key",
  "serviceRoleKey",
  "service_role_key",
  "authorization",
  "cookie",
  "set-cookie",
  "secret",
]);

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.has(k.toLowerCase())) {
        out[k] = "[redacted]";
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

function formatError(err: unknown): Meta {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      // Stack only in dev — can leak internal paths in prod logs
      ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    };
  }
  return { value: String(err) };
}

function emit(level: Level, msg: string, meta?: Meta) {
  const safeMeta = meta ? (redact(meta) as Meta) : undefined;
  const record = {
    level,
    ts: new Date().toISOString(),
    msg,
    ...(safeMeta || {}),
  };

  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(record)
      : prettyFormat(level, msg, safeMeta);

  const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  writer(line);
}

function prettyFormat(level: Level, msg: string, meta?: Meta): string {
  const tag = level === "error" ? "ERROR" : level === "warn" ? "WARN " : "INFO ";
  const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `[${tag}] ${msg}${metaStr}`;
}

export const logger = {
  info: (msg: string, meta?: Meta) => emit("info", msg, meta),
  warn: (msg: string, meta?: Meta) => emit("warn", msg, meta),
  error: (msg: string, err?: unknown, meta?: Meta) =>
    emit("error", msg, {
      ...(err !== undefined ? { err: formatError(err) } : {}),
      ...(meta || {}),
    }),
};
