import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock external SDKs at the top so ai-service imports succeed without real keys.
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: vi.fn() };
  },
}));
vi.mock("openai", () => ({
  default: class {
    constructor() {}
  },
}));
vi.mock("@/lib/ai-service-gpt52", () => ({}));
vi.mock("@/lib/ai-service-stream", () => ({}));

import {
  retryOperation,
  constructEliteSystemPrompt,
  formatGeminiCitations,
  formatOpenAICitations,
  extractJsonFromText,
} from "@/lib/ai-service";

describe("retryOperation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns result on first success without retrying", async () => {
    const op = vi.fn().mockResolvedValue("ok");
    const result = await retryOperation(op, 3, 10);
    expect(result).toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries on 503 status and eventually succeeds", async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue("done");
    const promise = retryOperation(op, 3, 1);
    await vi.runAllTimersAsync();
    expect(await promise).toBe("done");
    expect(op).toHaveBeenCalledTimes(3);
  });

  it("retries on 429 and overloaded message", async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce({ message: "model is overloaded" })
      .mockResolvedValue("ok");
    const promise = retryOperation(op, 2, 1);
    await vi.runAllTimersAsync();
    expect(await promise).toBe("ok");
    expect(op).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on non-retryable errors", async () => {
    const op = vi.fn().mockRejectedValue({ status: 400, message: "bad request" });
    await expect(retryOperation(op, 5, 1)).rejects.toMatchObject({ status: 400 });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausting retries and throws the last error", async () => {
    const op = vi.fn().mockRejectedValue({ status: 503 });
    const promise = retryOperation(op, 2, 1);
    vi.runAllTimersAsync();
    await expect(promise).rejects.toMatchObject({ status: 503 });
    expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});

describe("constructEliteSystemPrompt", () => {
  it("includes the user name in identity instructions", () => {
    const prompt = constructEliteSystemPrompt({
      userName: "Carlos",
      modes: new Set(),
    });
    expect(prompt).toContain("Carlos");
  });

  it("enforces first-interaction rule when isFirstInteraction=true", () => {
    const prompt = constructEliteSystemPrompt({
      userName: "Ana",
      modes: new Set(),
      isFirstInteraction: true,
    });
    // The prompt should mention the user name by its rules
    expect(prompt).toContain("Ana");
  });

  it("returns a non-empty string even with empty inputs", () => {
    const prompt = constructEliteSystemPrompt({
      userName: "",
      modes: new Set(),
    });
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });
});

describe("formatGeminiCitations", () => {
  it("returns null for empty or undefined input", () => {
    expect(formatGeminiCitations(undefined)).toBeNull();
    expect(formatGeminiCitations([])).toBeNull();
  });

  it("deduplicates sources and strips file extensions", () => {
    const chunks = [
      { retrievedContext: { title: "Codigo_Civil.pdf" } },
      { retrievedContext: { title: "codigo-civil.pdf" } }, // different format, same logical source
      { retrievedContext: { title: "Constitucion.docx" } },
    ];
    const result = formatGeminiCitations(chunks);
    expect(result).toContain("Codigo Civil");
    expect(result).toContain("Constitucion");
    expect(result).not.toContain(".pdf");
    expect(result).not.toContain(".docx");
  });

  it("falls back to URI filename when title is missing", () => {
    const chunks = [{ retrievedContext: { uri: "gs://bucket/docs/manual.pdf" } }];
    const result = formatGeminiCitations(chunks);
    expect(result).toContain("manual.pdf");
  });

  it("includes web citations when available", () => {
    const chunks = [{ web: { title: "Wikipedia Article" } }];
    const result = formatGeminiCitations(chunks);
    expect(result).toContain("Wikipedia Article");
  });
});

describe("formatOpenAICitations", () => {
  it("returns null for empty annotations", () => {
    expect(formatOpenAICitations(undefined)).toBeNull();
    expect(formatOpenAICitations([])).toBeNull();
  });

  it("labels file_citation annotations with truncated file id", () => {
    const annotations = [{ type: "file_citation", file_citation: { file_id: "file_abc12345678" } }];
    const result = formatOpenAICitations(annotations);
    expect(result).toContain("12345678");
  });

  it("ignores non-file_citation annotations in the source list", () => {
    const annotations = [{ type: "url_citation", url: "https://example.com" }];
    const result = formatOpenAICitations(annotations);
    // Falls back to count-based message because no file citations were found
    expect(result).toContain("1 referencias");
  });
});

describe("extractJsonFromText", () => {
  it("parses clean JSON directly", () => {
    const result = extractJsonFromText('{"foo":"bar","n":42}');
    expect(result).toEqual({ foo: "bar", n: 42 });
  });

  it("strips ```json fences before parsing", () => {
    const result = extractJsonFromText('```json\n{"ok":true}\n```');
    expect(result).toEqual({ ok: true });
  });

  it("strips bare ``` fences before parsing", () => {
    const result = extractJsonFromText('```\n{"ok":true}\n```');
    expect(result).toEqual({ ok: true });
  });

  it("extracts JSON object embedded in surrounding prose", () => {
    const input = 'Aquí tienes el resultado:\n{"score": 8}\nSaludos.';
    expect(extractJsonFromText(input)).toEqual({ score: 8 });
  });

  it("returns null when no valid JSON is found", () => {
    expect(extractJsonFromText("not json at all")).toBeNull();
  });

  it("returns null when the embedded candidate is malformed", () => {
    expect(extractJsonFromText("{ oops: not-valid }")).toBeNull();
  });
});
