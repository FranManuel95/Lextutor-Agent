import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateAudioResponseStream } from "@/lib/ai-service-stream";
import { constructEliteSystemPrompt } from "@/lib/ai-service";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { type GenerateContentResponse } from "@google/genai";
import { type Json } from "@/types/database.types";

export const runtime = "nodejs"; // Required for stream handling
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Auth Guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { chatId, audioPath, settings } = body;

    if (!chatId || !audioPath) {
      return new Response("Missing chatId or audioPath", { status: 400 });
    }

    // 2. Download Audio from Storage (Service Role)
    // Use Admin Client to ensure we can read the file regardless of RLS policies
    const adminSupabase = createAdminClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from("audio-notes")
      .download(audioPath);

    if (downloadError || !fileData) {
      logger.error("audio-stream: storage download failed", downloadError);
      throw new Error("Failed to retrieve audio file");
    }

    // Validate Size (Limit to 10MB for safety)
    if (fileData.size > 10 * 1024 * 1024) {
      throw new Error("Audio file too large (>10MB)");
    }

    // 3. Convert to Base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileData.type || "audio/webm"; // Default fallback

    // 4. Prepare Prompt
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name || "Estudiante";

    const systemPrompt = constructEliteSystemPrompt({
      userName,
      modes: new Set(settings?.modes || []),
      area: settings?.area || "general",
      isFirstInteraction: false,
    });

    const userInstruction = `ÁREA: ${(settings?.area || "general").toUpperCase()}\nINSTRUCCIÓN: Escucha el audio y responde. MANTÉN EL FORMATO: Markdown, negritas en palabras clave, listas estructuradas. Sé visual y claro.`;

    // 5. Start Streaming Response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Initial signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));

          // Call Gemini Streaming
          const geminiStream = await generateAudioResponseStream({
            base64Audio,
            mimeType,
            prompt: systemPrompt + "\n\n" + userInstruction,
          });

          for await (const chunk of geminiStream as AsyncGenerator<GenerateContentResponse>) {
            const chunkText = chunk.text ?? "";

            if (chunkText) {
              fullResponse += chunkText;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: chunkText })}\n\n`)
              );
            }
          }

          // 6. Persistence (Atomic at end)
          if (fullResponse) {
            // Save assistant message
            const { data: assistantMsg } = await supabase
              .from("messages")
              .insert({
                chat_id: chatId,
                user_id: user.id,
                role: "assistant" as const,
                content: fullResponse,
              })
              .select()
              .single();

            // Log event
            await supabase.from("student_events").insert({
              user_id: user.id,
              chat_id: chatId,
              message_id: assistantMsg?.id,
              area: settings?.area || "general",
              kind: "answer_submitted",
              payload: { audio: true, settings } as Json,
            });

            // Update Chat Timestamp
            await supabase
              .from("chats")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", chatId);
          }

          // Done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (streamError: unknown) {
          logger.error("audio-stream: streaming error", streamError);
          const streamErrMsg =
            streamError instanceof Error ? streamError.message : "Unknown streaming error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: streamErrMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    logger.error("audio-stream: route error", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
