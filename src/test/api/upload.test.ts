import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock @/lib/env ───────────────────────────────────────────────────────────
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    GEMINI_API_KEY: "test-gemini-key",
    GEMINI_FILESEARCH_STORE_ID: "fileSearchStores/test-store-123",
    OPENAI_API_KEY: undefined,
    OPENAI_VECTOR_STORE_ID: undefined,
    AI_PROVIDER: "gemini",
  },
}));

// ─── Mock @/server/security/requireAdmin ─────────────────────────────────────
const mockRequireAdmin = vi.fn();

vi.mock("@/server/security/requireAdmin", () => ({
  requireAdmin: mockRequireAdmin,
}));

// ─── Mock @/lib/logger ────────────────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── Mock @google/genai ───────────────────────────────────────────────────────
const mockUploadToFileSearchStore = vi.fn();
const mockOperationsGet = vi.fn();
const mockDocumentsList = vi.fn();

vi.mock("@google/genai", () => {
  class GoogleGenAI {
    fileSearchStores = {
      uploadToFileSearchStore: mockUploadToFileSearchStore,
      documents: { list: mockDocumentsList },
    };
    operations = { get: mockOperationsGet };
    constructor(_opts: unknown) {}
  }
  return { GoogleGenAI };
});

// ─── Mock @/utils/supabase/server ────────────────────────────────────────────
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({})),
}));

// ─── Mock @/lib/rateLimit ────────────────────────────────────────────────────
// The upload route checks an UPLOAD rate limit after requireAdmin passes.
// We allow by default so the test proceeds to the real logic under test.
const mockCheckRateLimit = vi.fn();

vi.mock("@/lib/rateLimit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rateLimit")>();
  return {
    ...actual,
    checkRateLimit: mockCheckRateLimit,
  };
});

// ─── Mock fs/promises (writeFile / unlink) ───────────────────────────────────
vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    writeFile: vi.fn(() => Promise.resolve()),
    unlink: vi.fn(() => Promise.resolve()),
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** PDF bytes (magic bytes %PDF) */
function pdfBytes(): ArrayBuffer {
  return new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]).buffer as ArrayBuffer;
}

/**
 * Build a NextRequest whose formData() is mocked to return a controlled FormData.
 * This sidesteps jsdom multipart-parsing issues where File names can be lost.
 */
function makeRequestWithFormData(fd: FormData): NextRequest {
  const req = new NextRequest("http://localhost/api/upload", { method: "POST" });
  req.formData = () => Promise.resolve(fd);
  return req;
}

function makeRequestWithNoFile(): NextRequest {
  const fd = new FormData();
  return makeRequestWithFormData(fd);
}

function makeRequestWithFile(file: File, extra: Record<string, string> = {}): NextRequest {
  const fd = new FormData();
  fd.append("file", file);
  for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  return makeRequestWithFormData(fd);
}

/** Shared Supabase mock with controllable maybeSingle and insert */
function makeMockSupabase(existingDoc: { id: string } | null = null) {
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: existingDoc, error: null });
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
      })),
      insert: mockInsert,
    })),
    _mockMaybeSingle: mockMaybeSingle,
    _mockInsert: mockInsert,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireAdmin.mockReset();
    mockCheckRateLimit.mockReset();
    mockUploadToFileSearchStore.mockReset();
    mockOperationsGet.mockReset();
    mockDocumentsList.mockReset();
    // Default: rate limit allows the request
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      current: 0,
      limit: 10,
      resetAt: new Date().toISOString(),
    });
  });

  it("returns 403 when user is not an admin", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Forbidden"));

    const { POST } = await import("@/app/api/upload/route");
    const res = await POST(
      makeRequestWithFile(new File([pdfBytes()], "test.pdf", { type: "application/pdf" }))
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 401 with 'Unauthorized' message when no session exists", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Unauthorized"));

    const { POST } = await import("@/app/api/upload/route");
    const res = await POST(
      makeRequestWithFile(new File([pdfBytes()], "test.pdf", { type: "application/pdf" }))
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when no file is provided", async () => {
    const supabase = makeMockSupabase();
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" }, supabase });

    const { POST } = await import("@/app/api/upload/route");
    const res = await POST(makeRequestWithNoFile());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no file/i);
  });

  it("returns 400 for a disallowed file extension", async () => {
    const supabase = makeMockSupabase();
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" }, supabase });

    const badFile = new File(["data"], "malware.exe", { type: "application/octet-stream" });
    const { POST } = await import("@/app/api/upload/route");
    const res = await POST(makeRequestWithFile(badFile));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no permitido/i);
  });

  it("returns 400 when a file has .pdf extension but invalid magic bytes", async () => {
    const supabase = makeMockSupabase();
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" }, supabase });

    const fakePdf = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], "fake.pdf", {
      type: "application/pdf",
    });
    const { POST } = await import("@/app/api/upload/route");
    const res = await POST(makeRequestWithFile(fakePdf));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/pdf/i);
  });

  it("returns 200 on a successful upload with Gemini document indexed in Supabase", async () => {
    const supabase = makeMockSupabase(null); // no existing doc → insert will be called
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" }, supabase });

    // Gemini upload returns a completed operation with documentName in response
    const doneOperation = {
      done: true,
      response: { documentName: "fileSearchStores/test-store-123/documents/doc-abc" },
    };
    mockUploadToFileSearchStore.mockResolvedValue(doneOperation);

    const { POST } = await import("@/app/api/upload/route");
    const res = await POST(
      makeRequestWithFile(new File([pdfBytes()], "lecture.pdf", { type: "application/pdf" }), {
        displayName: "Lecture Notes",
        area: "civil",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.document_name).toBe("fileSearchStores/test-store-123/documents/doc-abc");
    expect(body.area).toBe("civil");
  });

  it("does not insert a duplicate row when document already exists in Supabase", async () => {
    const supabase = makeMockSupabase({ id: "existing-doc-id" });
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" }, supabase });

    const doneOperation = {
      done: true,
      response: { documentName: "fileSearchStores/test-store-123/documents/doc-abc" },
    };
    mockUploadToFileSearchStore.mockResolvedValue(doneOperation);

    const { POST } = await import("@/app/api/upload/route");
    const res = await POST(
      makeRequestWithFile(new File([pdfBytes()], "doc.pdf", { type: "application/pdf" }))
    );

    expect(res.status).toBe(200);
    // insert should NOT have been called because the doc already exists
    expect(supabase._mockInsert).not.toHaveBeenCalled();
  });
});
