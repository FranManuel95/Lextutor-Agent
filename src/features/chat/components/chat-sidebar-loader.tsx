import { createClient } from "@/utils/supabase/server";
import { ChatSidebar } from "./chat-sidebar";
import { Chat } from "@/types/chat";

export async function ChatSidebarLoader() {
  const supabase = await createClient();

  // Use getSession() (cookie-only, no network call) to avoid hanging when
  // Supabase is slow. The middleware already validated the session.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return <ChatSidebar chats={[]} />;

  // Query with the user's own session (RLS filters by user_id automatically).
  // This avoids relying on SUPABASE_SERVICE_ROLE_KEY for the sidebar.
  const { data } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return <ChatSidebar chats={(data as Chat[]) || []} />;
}
