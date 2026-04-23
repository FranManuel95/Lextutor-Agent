import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/security/requireAdmin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireAdmin();

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.RAG_DOCS_LIST);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = parseInt(searchParams.get("limit") || "50", 10);
    const offsetRaw = parseInt(searchParams.get("offset") || "0", 10);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 50, 1), 200);
    const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0);

    const { data, count, error } = await supabase
      .from("rag_documents")
      .select("id, document_name, display_name, area, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      items: data ?? [],
      count: count ?? 0,
      limit,
      offset,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal Server Error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    logger.error("GET /api/rag/documents failed", e, { route: "/api/rag/documents", status });
    return NextResponse.json({ error: msg }, { status });
  }
}
