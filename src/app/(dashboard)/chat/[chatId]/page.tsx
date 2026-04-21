import { createClient } from "@/utils/supabase/server";
import { ChatList } from "@/features/chat/components/chat-list";
import { ChatInput } from "@/features/chat/components/chat-input";
import { ChatHeader } from "@/features/chat/components/chat-header";
import { redirect, notFound } from "next/navigation";
import type { Database } from "@/types/database.types";
import { Suspense } from "react";

// Separate async component for messages (can load independently)
async function ChatMessagesLoader({ chatId, userId }: { chatId: string; userId: string }) {
  const supabase = createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  type ProfileAvatar = Pick<Database["public"]["Tables"]["profiles"]["Row"], "avatar_url">;
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();
  const profileData = rawProfile as ProfileAvatar | null;

  return (
    <ChatList
      initialMessages={messages || []}
      userAvatar={profileData?.avatar_url ?? undefined}
      chatId={chatId}
    />
  );
}

// Loading fallback
function ChatSkeleton() {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex animate-pulse gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ChatIdPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // CRITICAL: Verify chat ownership ONLY (don't fetch extra data yet)
  const { data: chatData } = await supabase
    .from("chats")
    .select("id, title, user_id")
    .eq("id", chatId)
    .eq("user_id", user.id)
    .single();

  const chat = chatData as Database["public"]["Tables"]["chats"]["Row"] | null;

  if (!chat) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col bg-gem-onyx pt-20 md:pt-0">
      <ChatHeader chatId={chat.id} title={chat.title || undefined} />

      {/* Messages load with Suspense - shell appears immediately */}
      <Suspense fallback={<ChatSkeleton />}>
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <ChatMessagesLoader chatId={chatId} userId={user.id} />
        </div>
      </Suspense>

      <ChatInput chatId={chatId} />
    </div>
  );
}
