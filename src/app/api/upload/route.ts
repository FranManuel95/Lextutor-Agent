import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/utils/supabase/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import OpenAI from "openai";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const STORE_ID = process.env.GEMINI_FILESEARCH_STORE_ID!; // fileSearchStores/...

function safeBaseName(input: string) {
  const base = input.toLowerCase().replace(/\.[a-z0-9]+$/i, "");
  let slug = base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  if (!slug) slug = "document";
  if (slug.length > 60) slug = slug.slice(0, 60).replace(/-+$/, "");
  return slug;
}

function normalizeArea(area: string) {
  const a = (area || "").toLowerCase().trim();
  const allowed = new Set(["laboral", "civil", "mercantil", "procesal", "otro", "general"]);
  return allowed.has(a) ? a : "general";
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

import { requireAdmin } from "@/server/security/requireAdmin";

// ... existing imports ...

export async function POST(request: NextRequest) {
  // 1. Admin Verification
  let user;
  let supabase;
  try {
    const result = await requireAdmin();
    user = result.user;
    supabase = result.supabase;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Forbidden" }, { status: 403 });
  }

  if (!STORE_ID?.startsWith("fileSearchStores/")) {
    return NextResponse.json(
      { error: "Missing/invalid GEMINI_FILESEARCH_STORE_ID" },
      { status: 500 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e: any) {
    console.error("❌ Error parsing FormData (posible exceso de tamaño):", e);
    return NextResponse.json(
      {
        error:
          "Error al leer el archivo. Es posible que el archivo sea demasiado grande (límite recomendado: 10MB).",
      },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const displayName = (formData.get("displayName") as string) || file?.name || "document";
  const area = normalizeArea((formData.get("area") as string) || "general");

  if (!file) {
    console.error("❌ No file found in FormData");
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // 🛡️ File Validation
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. Size limit: 500MB
  const MAX_SIZE = 500 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return NextResponse.json(
      {
        error: "El archivo es demasiado grande. Máximo 500MB permitido.",
      },
      { status: 400 }
    );
  }

  // 2. Extension whitelist
  const ext = path.extname(file.name || "").toLowerCase();
  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      {
        error: `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // 3. Magic bytes verification (PDF only for now)
  if (ext === ".pdf") {
    const isPDF =
      buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // "%PDF"
    if (!isPDF) {
      return NextResponse.json(
        {
          error: "El archivo no es un PDF válido.",
        },
        { status: 400 }
      );
    }
  }

  // Temp file
  const tempPath = path.join(
    os.tmpdir(),
    `${safeBaseName(displayName)}-${Date.now().toString(36)}${ext}`
  );
  await writeFile(tempPath, buffer);

  try {
    // Upload & ingest to File Search Store (Gemini)
    console.log("🟢 Iniciando upload a Gemini File Search...");
    console.log("🟢 Store ID:", STORE_ID);
    console.log("🟢 Display Name:", displayName);

    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: tempPath,
      fileSearchStoreName: STORE_ID,
      config: {
        displayName,
        mimeType: file.type || "application/pdf",
        customMetadata: [{ key: "area", stringValue: area }],
      },
    } as any);

    console.log("🟢 Esperando procesamiento de Gemini...");
    while (!operation.done) {
      await sleep(1500);
      operation = await ai.operations.get({ operation } as any);
    }
    console.log(
      "🟢 Procesamiento completado. Resultado raw:",
      JSON.stringify(operation, null, 2).substring(0, 1000)
    );

    // Encontrar doc creado en el store
    let createdDocName: string | null = null;

    // Try getting name directly from operation response if available
    if (operation && (operation as any).response && (operation as any).response.documentName) {
      createdDocName = (operation as any).response.documentName;
      console.log("🟢 Nombre obtenido directamente de la operación:", createdDocName);
    }

    if (!createdDocName) {
      console.log("🟢 Nombre no disponible en operación, buscando por displayName (paginado)...");
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🟢 Intento ${attempt}/3: Buscando documento en el store...`);
        let pageToken: string | undefined = undefined;

        do {
          const listParams: any = {
            parent: STORE_ID,
            pageSize: 100,
          };
          if (pageToken) listParams.pageToken = pageToken;

          let docs: any[] = [];
          try {
            const response = await ai.fileSearchStores.documents.list(listParams);
            // Debug: Log raw response for first page
            if (!pageToken && attempt === 1) {
              console.log(
                "🔍 Raw List Response (first page):",
                JSON.stringify(response).substring(0, 500)
              );
            }

            // Handle different response structures
            if (
              response &&
              (response as any).documents &&
              Array.isArray((response as any).documents)
            ) {
              docs = (response as any).documents;
            } else if (Array.isArray(response)) {
              docs = response;
            }
            pageToken = (response as any)?.nextPageToken;
          } catch (e: any) {
            console.warn(`⚠️ Error listando docs (intento ${attempt}):`, e.message);
            break;
          }

          // Debug: Log first few names to check match
          if (!pageToken && docs.length > 0) {
            console.log(
              "🔍 Muestra de docs encontrados:",
              docs.slice(0, 3).map((d) => d.displayName)
            );
          }

          for (const d of docs) {
            if (d?.displayName === displayName) {
              createdDocName = d.name;
              break;
            }
          }

          if (createdDocName) break;
        } while (pageToken);

        if (createdDocName) break;

        // Wait before next attempt
        if (attempt < 3) await sleep(2000);
      }
    }

    if (!createdDocName) {
      console.error(
        "❌ Documento no encontrado tras 3 intentos. DisplayName buscado:",
        displayName
      );
      return NextResponse.json(
        { error: "Upload completed but document not found in store list (propagation delay)." },
        { status: 500 }
      );
    }

    console.log(`✅ Document uploaded to Gemini: ${createdDocName}`);

    // NUEVO: También subir a OpenAI si está configurado
    let openaiFileId: string | null = null;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_VECTOR_STORE_ID) {
      try {
        console.log("🔵 Uploading to OpenAI...");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Subir archivo a OpenAI usando Buffer para SDK v4+
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const blob = new Blob([fileBuffer], { type: file.type || "application/pdf" });
        const fileObj = new File([blob], file.name || "document.pdf", {
          type: file.type || "application/pdf",
        });

        const openaiFile = await openai.files.create({
          file: fileObj,
          purpose: "assistants",
        });

        // Añadir al Vector Store usando API directa (SDK tiene problemas de tipos)
        const vectorStoreResponse = await fetch(
          `https://api.openai.com/v1/vector_stores/${process.env.OPENAI_VECTOR_STORE_ID}/files`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
              "OpenAI-Beta": "assistants=v2",
            },
            body: JSON.stringify({ file_id: openaiFile.id }),
          }
        );

        if (!vectorStoreResponse.ok) {
          const errorData = await vectorStoreResponse.json();
          throw new Error(`Vector Store API error: ${JSON.stringify(errorData)}`);
        }

        await vectorStoreResponse.json();

        openaiFileId = openaiFile.id;
        console.log(`✅ Document also uploaded to OpenAI: ${openaiFile.id}`);
      } catch (e: any) {
        console.error("⚠️ OpenAI upload failed (non-critical):", e?.message || e);
        console.error("Stack:", e?.stack);
        console.error("Error completo:", JSON.stringify(e, null, 2));
        // No bloqueamos si OpenAI falla
      }
    }

    // Evitar duplicado si ya existe
    const { data: existing } = await supabase
      .from("rag_documents")
      .select("id")
      .eq("document_name", createdDocName)
      .maybeSingle();

    if (!existing) {
      const { error: dbError } = await supabase.from("rag_documents").insert({
        store_name: STORE_ID,
        document_name: createdDocName,
        display_name: displayName,
        area,
        openai_file_id: openaiFileId, // NUEVO: Guardar ID de OpenAI
      } as any);

      if (dbError) throw dbError;
    }

    return NextResponse.json({
      success: true,
      document_name: createdDocName,
      display_name: displayName,
      area,
      openai_synced: !!openaiFileId,
    });
  } catch (error: any) {
    console.error("Upload error:", error?.status, error?.message || error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  } finally {
    try {
      await unlink(tempPath);
    } catch {}
  }
}
