import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/security/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { supabase } = await requireAdmin();

        const { data, error } = await supabase
            .from("rag_documents")
            .select("id, document_name, display_name, area, created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // ✅ Array directo (como espera tu UI)
        return NextResponse.json(data ?? []);
    } catch (e: any) {
        console.error("GET /api/rag/documents error:", e?.message || e);

        const msg = e?.message || "Internal Server Error";
        const status =
            msg === "Unauthorized" ? 401 :
                msg === "Forbidden" ? 403 :
                    500;

        return NextResponse.json({ error: msg }, { status });
    }
}
