import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { constructEliteSystemPrompt, generateAudioResponse } from "@/lib/ai-service";
import { z } from "zod";
import { Database } from "@/types/database.types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zod Schema for validation
const settingsSchema = z
  .object({
    area: z.string().max(64).optional(),
    modes: z.array(z.string().max(64)).max(16).optional(),
    detailLevel: z.enum(["brief", "normal", "extended"]).optional(),
    summary: z.string().max(4000).optional(),
  })
  .strict();

const audioPathSchema = z
  .string()
  .max(128)
  .regex(/^[0-9a-f-]{36}\/[a-zA-Z0-9_\-]+\.(webm|mp3|wav|ogg|m4a)$/);

const audioMessageSchema = z.object({
  chatId: z.string().uuid(),
  audioPath: audioPathSchema,
  settings: settingsSchema.optional(),
  area: z.string().max(64).optional(),
  studyMode: z.string().max(64).optional(),
});

export const POST = createApiHandler(
  async ({ user, supabase, body }) => {
    const { chatId, audioPath, settings, area, studyMode } = body;

    // 1. Setup Admin Client for Storage Access
    const adminSupabase = createAdminClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Normalize Settings
    const fallbackModes: string[] = studyMode && studyMode !== "tutor" ? [studyMode] : [];
    const effectiveSettings = settings || {
      area: area || "otro",
      modes: fallbackModes,
      detailLevel: "normal" as const,
    };

    // 3. Download Audio
    logger.info("audio/message: downloading", { audioPath });
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from("audio-notes")
      .download(audioPath);

    if (downloadError || !fileData) {
      logger.error("audio/message: download failed", downloadError);
      throw new Error(`Audio download failed: ${downloadError?.message}`);
    }
    logger.info("audio/message: downloaded", { bytes: fileData.size });

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // 4. Insert User Message (Initial state)
    const { data: userMsgData, error: userMsgError } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        user_id: user.id,
        role: "user" as const,
        content: "🎤 Procesando audio...", // Placeholder
        audio_path: audioPath,
      })
      .select()
      .single();

    const userMsg = userMsgData;
    if (userMsgError) logger.error("audio/message: db insert failed", userMsgError);

    // 5. Build System Prompt & Parsing Instruction
    // Fetch profile name for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name || ""; // Default to empty if no name (neutral addressing)

    const modes = new Set<string>(effectiveSettings.modes || []);
    const system = constructEliteSystemPrompt({
      userName,
      modes,
      area: effectiveSettings.area,
      isFirstInteraction: false,
    });

    // Instruct Gemini to transcribe first
    const prompt = `${system}\n\nÁREA SUGERIDA: ${effectiveSettings.area?.toUpperCase() || "GENERAL"}\nINSTRUCCIÓN TÉCNICA (IMPORTANTE): Primero, transcribe el audio del usuario literalmente comenzando con "TRANSCRIPT: " y terminando con "|||". Después, responde a la consulta del estudiante siguiendo tu personalidad.`;

    // 6. Generate Response via AI Service
    logger.info("audio/message: sending to Gemini");
    let responseText = "";
    try {
      responseText = await generateAudioResponse({
        base64Audio,
        prompt,
      });
    } catch (aiErr) {
      logger.error("audio/message: Gemini failed", aiErr);
      throw new Error("AI Processing Failed");
    }
    logger.info("audio/message: Gemini responded", { chars: responseText.length });

    let transcript = "Audio recibido (Sin transcripción)";
    let assistantResponse = responseText;

    // 7. Parse Output (Transcript ||| Response)
    const separator = "|||";
    if (responseText.includes(separator)) {
      const parts = responseText.split(separator);
      const transcriptPart = parts[0];
      assistantResponse = parts.slice(1).join(separator).trim();

      // Clean transcript
      transcript = transcriptPart.replace(/TRANSCRIPT:\s*/i, "").trim();
    } else if (responseText.startsWith("TRANSCRIPT:")) {
      // Fallback if separator missing but prefix exists
      transcript = responseText;
    }

    // 8. Update User Message with Transcript
    if (userMsg && transcript) {
      await supabase.from("messages").update({ content: transcript }).eq("id", userMsg.id);
    }

    // 9. Insert Assistant Message
    const { error: assistantError } = await supabase.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      role: "assistant" as const,
      content: assistantResponse,
    });

    if (assistantError) throw assistantError;

    // 10. Log Student Event (Progress)
    // Wrapped in try-catch so it doesn't fail the whole request
    try {
      await supabase.from("student_events").insert({
        user_id: user.id,
        chat_id: chatId,
        area: effectiveSettings.area,
        kind: "answer_submitted",
        payload: {
          settings: effectiveSettings,
          audio: true,
        } as Database["public"]["Tables"]["student_events"]["Insert"]["payload"],
      });
    } catch (logErr) {
      logger.warn("audio/message: event log failed", {
        message: logErr instanceof Error ? logErr.message : String(logErr),
      });
    }

    return {
      transcript,
      assistantResponse,
    };
  },
  {
    schema: audioMessageSchema,
    rateLimit: RATE_LIMITS.AUDIO_MESSAGE,
  }
);
