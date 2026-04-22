import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { generateResponseStream } from "@/lib/ai-service-stream";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

type ChatOwnership = { user_id: string; title: string | null };
type ProfileName = { full_name: string | null };
type HistoryRow = { role: string; content: string };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const streamSchema = z.object({
  chatId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  settings: z
    .object({
      area: z.string().optional(),
      modes: z.array(z.string()).optional(),
      detailLevel: z.string().optional(),
      summary: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.CHAT);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `Límite excedido. Intenta de nuevo a las ${new Date(rateLimit.resetAt).toLocaleTimeString("es-ES")}.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate body
  let chatId: string, message: string, settings: any;
  try {
    const parsed = streamSchema.parse(await request.json());
    chatId = parsed.chatId;
    message = parsed.message;
    settings = parsed.settings;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Verify chat ownership
  const { data: chatRaw } = await supabase
    .from("chats")
    .select("user_id, title")
    .eq("id", chatId)
    .maybeSingle();

  const chat = chatRaw as ChatOwnership | null;
  if (!chat || chat.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Save user message immediately
  await supabase.from("messages").insert({
    chat_id: chatId,
    user_id: user.id,
    role: "user",
    content: message,
  } as any);

  // 3. Load conversation history
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(10);

  const history = ((recentMessages as HistoryRow[] | null) || []).reverse();

  // 4. Get user profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as ProfileName | null;
  const userName = profile?.full_name?.split(" ")[0] || "";

  // 5. Create streaming response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      let streamSucceeded = false;
      try {
        // Send initial event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));

        // Get AI stream
        const geminiStream = await generateResponseStream({
          message,
          history: history.filter((m) => m.content !== message),
          settings: {
            area: settings?.area || "general",
            modes: settings?.modes || [],
            detailLevel: settings?.detailLevel || "normal",
          },
          options: {
            userName,
            isFirstInteraction: !history.some((m) => m.role === "assistant"),
          },
        });

        // Stream chunks to client
        let lastResponse: any = null;
        for await (const chunk of geminiStream) {
          const text = chunk.text || "";
          fullResponse += text;
          lastResponse = chunk;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`)
          );
        }

        // Add citations if available
        const lastChunk = lastResponse?.candidates?.[0];
        const grounding = lastChunk?.groundingMetadata;

        if (grounding?.groundingChunks && grounding.groundingChunks.length > 0) {
          const { formatGeminiCitations } = await import("@/lib/ai-service");
          const citations = formatGeminiCitations(grounding.groundingChunks);
          if (citations) {
            fullResponse += `\n\n${citations}`;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "chunk", text: `\n\n${citations}` })}\n\n`
              )
            );
          }
        }

        streamSucceeded = true;

        // Send done event before saving so client renders immediately
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();

        // Only persist if stream completed — avoids saving partial/empty responses
        await saveAssistantMessage(
          supabase,
          chatId,
          user.id,
          fullResponse,
          chat.title,
          message,
          settings
        );
      } catch (error: any) {
        logger.error("chat/stream failed", error, { chatId, userId: user.id });
        if (!streamSucceeded) {
          const errorMessage = error?.message || "Unknown streaming error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`)
          );
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

// Background task to save assistant message
async function saveAssistantMessage(
  supabase: any,
  chatId: string,
  userId: string,
  content: string,
  currentTitle: string | null,
  userMessage: string,
  settings: any
) {
  try {
    // Save assistant message
    const { data: assistantMsg } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        user_id: userId,
        role: "assistant",
        content: content,
      } as any)
      .select()
      .single();

    // Auto-title if needed
    if (!currentTitle || currentTitle === "Nuevo Chat") {
      const firstSentence = userMessage.split(/[.\n?!]/)[0];
      const newTitle = firstSentence.trim().substring(0, 40);
      if (newTitle && newTitle.length > 2) {
        await supabase
          .from("chats")
          .update({ title: newTitle } as any)
          .eq("id", chatId);
      }
    }

    // Log event
    await supabase.from("student_events").insert({
      user_id: userId,
      chat_id: chatId,
      message_id: assistantMsg?.id,
      area: settings?.area || "general",
      kind: "answer_submitted",
      payload: { settings },
    } as any);

    // Update chat timestamp
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() } as any)
      .eq("id", chatId);
  } catch (error) {
    logger.error("Failed to save assistant message", error, { chatId, userId });
  }
}
