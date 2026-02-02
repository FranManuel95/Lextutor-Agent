import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { constructEliteSystemPrompt, generateAudioResponse } from "@/lib/ai-service";
import { z } from "zod";
import { Database } from "@/types/database.types";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zod Schema for validation
const audioMessageSchema = z.object({
    chatId: z.string().uuid(),
    audioPath: z.string(),
    settings: z.any().optional(), // Flexible for now
    area: z.string().optional(),
    studyMode: z.string().optional()
});

export const POST = createApiHandler(
    async ({ user, supabase, body }) => {
        const { chatId, audioPath, settings, area, studyMode } = body;

        // 1. Setup Admin Client for Storage Access
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY missing in message route");
            throw new Error("Server Configuration Error");
        }
        const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

        // 2. Normalize Settings
        const effectiveSettings = settings || {
            area: area || "otro",
            modes: studyMode === 'tutor' ? [] : [studyMode],
            detailLevel: 'normal'
        };

        // 3. Download Audio
        const { data: fileData, error: downloadError } = await adminSupabase
            .storage
            .from('audio-notes')
            .download(audioPath);

        if (downloadError || !fileData) {
            throw new Error(`Audio download failed: ${downloadError?.message}`);
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // 4. Insert User Message (Initial state)
        const { data: userMsgData, error: userMsgError } = await supabase.from("messages").insert({
            chat_id: chatId,
            user_id: user.id,
            role: "user",
            content: "🎤 Procesando audio...", // Placeholder
            audio_path: audioPath,
        } as any).select().single();

        const userMsg = userMsgData as Database['public']['Tables']['messages']['Row'] | null;

        if (userMsgError) {
            console.error("Failed to save user audio message:", userMsgError);
        }

        // 5. Build System Prompt & Parsing Instruction
        const modes = new Set<string>(effectiveSettings.modes || []);
        const system = constructEliteSystemPrompt({
            userName: "Estudiante", // Logic to get name from profile could be added if needed
            modes,
            area: effectiveSettings.area,
            isFirstInteraction: false
        });

        // Instruct Gemini to transcribe first
        const prompt = `${system}\n\nÁREA SUGERIDA: ${effectiveSettings.area?.toUpperCase() || 'GENERAL'}\nINSTRUCCIÓN TÉCNICA (IMPORTANTE): Primero, transcribe el audio del usuario literalmente comenzando con "TRANSCRIPT: " y terminando con "|||". Después, responde a la consulta del estudiante siguiendo tu personalidad.`;

        // 6. Generate Response via AI Service
        // Note: generateAudioResponse handles the Gemini call and citations format
        const responseText = await generateAudioResponse({
            base64Audio,
            prompt
        });

        let transcript = "Audio recibido (Sin transcripción)";
        let assistantResponse = responseText;

        // 7. Parse Output (Transcript ||| Response)
        const separator = "|||";
        // Check if the response contains the separator. 
        // Note: responseText might now contain appended citations at the very end.
        // Format: "TRANSCRIPT: ... ||| Response ... \n\n _(Sources)_"

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
            await supabase.from("messages").update({
                content: transcript
            } as unknown as never).eq("id", userMsg.id);
        }

        // 9. Insert Assistant Message
        const { error: assistantError } = await supabase.from("messages").insert({
            chat_id: chatId,
            user_id: user.id,
            role: "assistant",
            content: assistantResponse
        } as any);

        if (assistantError) throw assistantError;

        // 10. Log Student Event (Progress)
        await supabase.from('student_events').insert({
            user_id: user.id,
            chat_id: chatId,
            area: effectiveSettings.area,
            kind: 'answer_submitted',
            payload: { settings: effectiveSettings, audio: true }
        } as any);

        return {
            transcript,
            assistantResponse
        };
    },
    {
        schema: audioMessageSchema,
        rateLimit: RATE_LIMITS.AUDIO_MESSAGE
    }
);
