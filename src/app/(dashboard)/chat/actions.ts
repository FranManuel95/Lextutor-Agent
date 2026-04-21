"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { generateResponse } from "@/lib/ai-service";

type TutorPrefs = { area: string; modes: string[]; detailLevel: string };
type ProfileWithPrefs = { tutor_prefs: TutorPrefs | null; full_name: string | null } | null;

export async function createChat() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Profile for Name & Prefs
  const { data: profile } = await supabase
    .from("profiles")
    .select("tutor_prefs, full_name")
    .eq("id", user.id)
    .single();

  const settings = (profile as ProfileWithPrefs)?.tutor_prefs || {
    area: "general",
    modes: [],
    detailLevel: "normal",
  };
  const userName = (profile as ProfileWithPrefs)?.full_name?.split(" ")[0] || "";

  // 2. Create Chat
  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: "Nuevo Chat",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat:", error);
    return { error: "Failed to create chat" };
  }

  const chatId = data?.id;

  // 3. Proactive Agent Greeting (Generate & Save)
  try {
    // OPTIMIZATION: Use static instant greeting instead of waiting for AI generation (saves 5-8s)
    const activeMode = settings.modes?.length > 0 ? settings.modes.join(", ") : "Tutor General";
    const activeArea = settings.area || "General";

    const welcomeMessage = `Hola ${userName}, soy Lextutor tu tutor pedagógico inteligente. ⚖️

Veo que quieres practicar sobre derecho **${activeArea.toUpperCase()}** usando el modo **${activeMode.toUpperCase()}**.

Estoy aquí para ayudarte a dominar todas las áreas del derecho. Puedes pedirme que:

1.  Resuma una normativa específica.
2.  Te explique un concepto con ejemplos reales.
3.  Guiarte paso a paso.

¿Con qué tema o materia quieres empezar?`;

    await supabase.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      role: "assistant",
      content: welcomeMessage,
    });
  } catch (err) {
    console.error("Failed to insert welcome message:", err);
  }

  revalidateTag(`chats-${user.id}`);
  revalidatePath("/chat");
  redirect(`/chat/${chatId}`);
}

export async function sendMessage(
  chatId: string,
  content: string,
  settings: {
    area: string;
    modes: string[];
    detailLevel: string;
    preset?: string;
  }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Save user message
  const { error: messageError } = await supabase.from("messages").insert({
    chat_id: chatId,
    user_id: user.id,
    role: "user",
    content: content,
  });

  if (messageError) {
    console.error("Error sending message:", messageError);
    return { error: "Failed to send message" };
  }

  // 3. Generate AI Response
  let aiResponse = "Lo siento, no pude procesar tu solicitud.";

  // Fetch conversation history for context (last 6 messages)
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(6);

  const history = (recentMessages || []).reverse().map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Fetch profile for personalization
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userName = (profile as { full_name: string | null } | null)?.full_name || "";

  try {
    aiResponse = await generateResponse({
      message: content,
      history,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: settings as any,
      options: { userName },
    });
  } catch (error) {
    console.error("AI Service Error:", error);
    aiResponse = "Error al conectar con el tutor inteligente. Intenta de nuevo.";
  }

  // 4. Save assistant message
  const { data: assistantMsg } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      user_id: user.id,
      role: "assistant",
      content: aiResponse,
    })
    .select()
    .single();

  // 5. Auto-Title Check (Deterministic First Sentence)
  const { data: currentChat } = await supabase
    .from("chats")
    .select("title")
    .eq("id", chatId)
    .single();

  if (!currentChat?.title || currentChat.title === "Nuevo Chat") {
    const firstSentence = content.split(/[.\n?!]/)[0];
    const newTitle = firstSentence.trim().substring(0, 40);
    if (newTitle && newTitle.length > 2) {
      await supabase.from("chats").update({ title: newTitle }).eq("id", chatId);
    }
  }

  // 4b. Log Student Event (Progress)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("student_events") as any).insert({
    user_id: user.id,
    chat_id: chatId,
    message_id: assistantMsg?.id,
    area: settings.area,
    kind: "answer_submitted",
    payload: { settings },
  });

  // 6. Update chat updated_at
  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);

  revalidateTag(`chats-${user.id}`);
  revalidatePath(`/chat/${chatId}`);
  revalidatePath(`/chat`);
}

export async function renameChat(chatId: string, newTitle: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("chats")
    .update({ title: newTitle, updated_at: new Date().toISOString() })
    .eq("id", chatId)
    .eq("user_id", user.id);

  revalidateTag(`chats-${user.id}`);
  revalidatePath("/chat");
  return { success: true };
}
