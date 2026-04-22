import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { captureException, captureMessage, setTelemetryUser, withTelemetry } from "@/lib/telemetry";

// Spy on logger indirectly via console.
// logger.error/warn/info route to console.error/warn/log.
describe("telemetry wrapper", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("captureException routes errors to logger.error", () => {
    captureException(new Error("boom"));
    expect(errSpy).toHaveBeenCalledTimes(1);
  });

  it("captureException includes user and extra context", () => {
    captureException(new Error("boom"), {
      user: { id: "u1", email: "a@b.com" },
      extra: { attemptId: "x" },
      tags: { area: "civil" },
    });
    expect(errSpy).toHaveBeenCalled();
    const [payload] = errSpy.mock.calls[0];
    expect(String(payload)).toContain("u1");
    expect(String(payload)).toContain("civil");
    expect(String(payload)).toContain("attemptId");
  });

  it("captureMessage routes to the right log level", () => {
    captureMessage("hello", "info");
    captureMessage("careful", "warn");
    captureMessage("bad", "error");
    expect(logSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
  });

  it("setTelemetryUser is a no-op that doesn't throw", () => {
    expect(() => setTelemetryUser({ id: "u1" })).not.toThrow();
    expect(() => setTelemetryUser(null)).not.toThrow();
  });

  it("withTelemetry reports rejection and re-throws", async () => {
    await expect(
      withTelemetry("task", async () => {
        throw new Error("oops");
      })
    ).rejects.toThrow("oops");
    expect(errSpy).toHaveBeenCalled();
  });

  it("withTelemetry passes through resolved values", async () => {
    const result = await withTelemetry("task", async () => 42);
    expect(result).toBe(42);
  });
});
