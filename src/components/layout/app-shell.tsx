import { createClient } from "@/utils/supabase/server";
import { ChatSidebarLoader } from "@/features/chat/components/chat-sidebar-loader";
import { MobileSidebarLoader } from "@/features/chat/components/mobile-sidebar-loader";
import { SidebarSkeleton } from "@/features/chat/components/sidebar-skeleton";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

// Cache sidebar data for 30 seconds
export const revalidate = 30;

async function getAuthenticatedUser() {
  const supabase = await createClient();

  // Race getUser() (validates JWT server-side) against an 8s timeout.
  // If Supabase is unreachable we fall back to the session cookie so the
  // user isn't hit with a 504 — the middleware already verified the session.
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));

  try {
    const result = await Promise.race([supabase.auth.getUser().then((r) => r.data.user), timeout]);

    if (result !== null) return result;

    // Timeout path — fall back to cookie-based session (no network call)
    logger.warn("app-shell: getUser timed out, falling back to getSession");
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  } catch {
    logger.warn("app-shell: getUser threw, falling back to getSession");
    const supabase2 = await createClient();
    const { data } = await supabase2.auth.getSession();
    return data.session?.user ?? null;
  }
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?message=" + encodeURIComponent("Sesión expirada. Por favor inicia sesión."));
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden h-full md:flex">
        <Suspense fallback={<SidebarSkeleton />}>
          <ChatSidebarLoader />
        </Suspense>
      </aside>
      <main className="custom-scrollbar flex flex-1 flex-col overflow-y-auto bg-gem-onyx">
        <Suspense
          fallback={
            <div className="flex h-14 items-center border-b border-white/5 bg-gem-onyx px-4">
              <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
            </div>
          }
        >
          <MobileSidebarLoader />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
