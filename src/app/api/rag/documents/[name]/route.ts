import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/security/requireAdmin";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function DELETE(_req: NextRequest, ctx: { params: { name: string } }) {
  try {
    const { supabase } = await requireAdmin();

    const documentName = decodeURIComponent(ctx.params.name);

    if (!documentName) {
      return NextResponse.json({ error: "Missing document name" }, { status: 400 });
    }

    // Permite borrar 'files/...' (legacy/direct) y 'fileSearchStores/.../documents/...' (standard)
    const isStoreDoc =
      documentName.startsWith("fileSearchStores/") && documentName.includes("/documents/");
    const isFile = documentName.startsWith("files/");

    if (!isStoreDoc && !isFile) {
      return NextResponse.json({ error: "Invalid document name format" }, { status: 400 });
    }

    // NUEVO: Obtener openai_file_id de la DB antes de borrar
    const { data: doc } = (await supabase
      .from("rag_documents")
      .select("openai_file_id")
      .eq("document_name", documentName)
      .maybeSingle()) as { data: { openai_file_id: string | null } | null };

    // NUEVO: Borrar de OpenAI si existe
    if (doc?.openai_file_id && env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        await openai.files.del(doc.openai_file_id);
        console.log(`✅ Document also deleted from OpenAI: ${doc.openai_file_id}`);
      } catch (e: any) {
        logger.warn("OpenAI delete failed (continuing)", { message: e?.message });
        // Continuar aunque falle
      }
    }

    // 1) Borrar de Gemini
    try {
      if (isStoreDoc) {
        await ai.fileSearchStores.documents.delete({
          name: documentName,
          config: { force: true },
        } as any);
      } else if (isFile) {
        await ai.files.delete({ name: documentName });
      }
    } catch (e: any) {
      logger.warn("Gemini delete failed (continuing to DB cleanup)", {
        status: e?.status,
        message: e?.message,
      });
      // Ignorar 404 para permitir limpieza de DB
    }

    // 2) Borrar de Supabase (DB)
    const { error } = await supabase
      .from("rag_documents")
      .delete()
      .eq("document_name", documentName);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || "Internal Server Error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    logger.error("DELETE /api/rag/documents/[name] failed", e, {
      route: "/api/rag/documents/[name]",
      status,
    });
    return NextResponse.json({ error: msg }, { status });
  }
}
