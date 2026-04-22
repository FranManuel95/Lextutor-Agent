import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";

export const runtime = "nodejs";

const searchSchema = z
  .object({
    q: z.string().min(2).max(100),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .strict();

type MessageHit = {
  id: string;
  chat_id: string;
  content: string;
  role: string;
  created_at: string;
};

export const POST = createApiHandler(
  async ({ user, supabase, body }) => {
    const { q, limit = 20 } = body;

    // Full-text-ish search via ilike on the user's own messages.
    // Supabase's RLS on messages already filters by user_id, but we double-filter to be safe.
    const { data, error } = await supabase
      .from("messages")
      .select("id, chat_id, content, role, created_at")
      .eq("user_id", user.id)
      .ilike("content", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const messages = (data ?? []) as MessageHit[];

    // Group hits by chat_id and fetch chat titles in one round-trip.
    const chatIds = Array.from(new Set(messages.map((m) => m.chat_id)));
    let titlesById: Record<string, string> = {};
    if (chatIds.length > 0) {
      const { data: chats } = await supabase.from("chats").select("id, title").in("id", chatIds);
      titlesById = Object.fromEntries(
        ((chats ?? []) as Array<{ id: string; title: string | null }>).map((c) => [
          c.id,
          c.title ?? "Sin título",
        ])
      );
    }

    const snippet = (text: string, query: string): string => {
      const lower = text.toLowerCase();
      const idx = lower.indexOf(query.toLowerCase());
      if (idx === -1) return text.slice(0, 120);
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + query.length + 80);
      return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    };

    return {
      query: q,
      count: messages.length,
      results: messages.map((m) => ({
        chatId: m.chat_id,
        chatTitle: titlesById[m.chat_id] ?? "Sin título",
        messageId: m.id,
        role: m.role,
        snippet: snippet(m.content, q),
        createdAt: m.created_at,
      })),
    };
  },
  { schema: searchSchema }
);
