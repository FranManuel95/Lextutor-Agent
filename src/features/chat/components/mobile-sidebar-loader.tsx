import { createClient } from "@/utils/supabase/server";
import { MobileSidebar } from "./mobile-sidebar";
import { getCachedChats } from "@/lib/data/get-chats";

export async function MobileSidebarLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <MobileSidebar chats={[]} />;

  const chats = await getCachedChats(user.id);

  return <MobileSidebar chats={chats} />;
}
