import { NextResponse } from "next/server";
import { chatSchema } from "@/lib/server-utils";
import { createApiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { generateResponse } from "@/lib/ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createApiHandler(
  async ({ user, supabase, body }) => {
    const { chatId, message, settings } = body;

    // 1. Load Profile and Preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("tutor_prefs, full_name")
      .eq("id", user.id)
      .single();

    let effectiveSettings = settings;
    if (!effectiveSettings) {
      effectiveSettings = (profile as any)?.tutor_prefs || {
        area: "general",
        modes: [],
        detailLevel: "normal",
      };
    }

    const area = effectiveSettings?.area || "general";
    const userName = (profile as any)?.full_name?.split(" ")[0] || "Estudiante";

    // 2. Verify Chat Ownership and Get Title
    const { data: chat } = await supabase
      .from("chats")
      .select("user_id, title")
      .eq("id", chatId)
      .single();

    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Insert User Message (Persist immediately)
    await supabase.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      role: "user",
      content: message,
    } as any);

    // 4. Auto-title (Deterministically)
    if ((!chat.title || chat.title === "Nuevo Chat") && message.trim().length > 3) {
      const firstSentence = message.split(/[.\n?!]/)[0];
      const newTitle = firstSentence.trim().substring(0, 40);
      if (newTitle) {
        // Non-blocking update
        supabase
          .from("chats")
          .update({ title: newTitle } as any)
          .eq("id", chatId)
          .then();
      }
    }

    // 5. Load Memory (History + Summary)
    const [historyRes, summaryRes] = await Promise.all([
      supabase
        .from("messages")
        .select("role, content")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("chat_summaries").select("summary_text").eq("chat_id", chatId).single(),
    ]);

    const history = ((historyRes.data as any[]) || []).reverse();
    const summary = (summaryRes.data as any)?.summary_text || "";

    // 6. Generate AI Response
    const assistantResponse = await generateResponse({
      message,
      history: history.filter((m) => m.content !== message),
      settings: {
        area: effectiveSettings?.area || "general",
        modes: effectiveSettings?.modes || [],
        detailLevel: effectiveSettings?.detailLevel || "normal",
        summary,
      },
      options: {
        userName,
        isFirstInteraction: !history.some((m) => m.role === "assistant"),
      },
    });

    // 7. Fire and Forget: Save Response and Audit Events
    const savePromise = (async () => {
      // Save assistant response
      await supabase.from("messages").insert({
        chat_id: chatId,
        user_id: user.id,
        role: "assistant",
        content: assistantResponse,
      } as any);

      // Log Student Event
      await supabase.from("student_events").insert({
        user_id: user.id,
        chat_id: chatId,
        area,
        kind: "answer_submitted",
        payload: { settings: effectiveSettings },
      } as any);

      // Ensure summary placeholder exists
      if (!summaryRes.data) {
        await supabase.from("chat_summaries").insert({
          chat_id: chatId,
          user_id: user.id,
          summary_text: "",
        } as any);
      }
    })();

    // Await to guarantee DB persistence before the serverless function exits
    await savePromise;

    return {
      response: assistantResponse,
      grounding: null,
    };
  },
  {
    schema: chatSchema,
    rateLimit: RATE_LIMITS.CHAT,
  }
);
