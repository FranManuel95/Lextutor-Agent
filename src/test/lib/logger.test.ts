import { describe, it, expect, beforeEach, vi } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    logSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  it("info goes to console.log", () => {
    logger.info("hello");
    expect(logSpy).toHaveBeenCalledOnce();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("warn goes to console.warn", () => {
    logger.warn("careful");
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("error goes to console.error", () => {
    logger.error("boom", new Error("bad"));
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it("redacts sensitive keys in meta", () => {
    logger.info("event", { token: "secret123", user: "alice", password: "hunter2" });
    const output = String(logSpy.mock.calls[0][0]);
    expect(output).not.toContain("secret123");
    expect(output).not.toContain("hunter2");
    expect(output).toContain("[redacted]");
    expect(output).toContain("alice");
  });

  it("redacts sensitive keys case-insensitively", () => {
    logger.info("event", { Authorization: "Bearer abc", API_KEY: "xyz" });
    const output = String(logSpy.mock.calls[0][0]);
    expect(output).not.toContain("Bearer abc");
    expect(output).not.toContain("xyz");
  });

  it("formats Error instances with name and message", () => {
    logger.error("failed", new Error("db down"));
    const output = String(errorSpy.mock.calls[0][0]);
    expect(output).toContain("db down");
    expect(output).toContain("Error");
  });

  it("handles non-Error values in error()", () => {
    logger.error("failed", "string error");
    const output = String(errorSpy.mock.calls[0][0]);
    expect(output).toContain("string error");
  });
});
