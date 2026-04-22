import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  Users,
  Activity,
  MessageSquare,
  ClipboardList,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminMobileSidebar } from "@/components/admin-mobile-sidebar";
import { z } from "zod";

export const dynamic = "force-dynamic";

const profileSchema = z.object({ role: z.string() });

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const parsed = profileSchema.safeParse(profile);
  if (!parsed.success || parsed.data.role !== "admin") {
    redirect("/chat?error=forbidden");
  }

  return (
    <div className="flex min-h-screen bg-gem-onyx font-sans text-gem-offwhite">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-law-accent/20 bg-gem-slate md:flex">
        <div className="border-b border-law-accent/10 p-6">
          <h1 className="flex items-center gap-2 font-serif text-xl text-law-gold">
            <ShieldCheck className="h-6 w-6" />
            Admin Panel
          </h1>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <Link href="/admin">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 transition-colors hover:bg-law-gold/10 hover:text-law-gold"
            >
              <Activity className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/rag">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 transition-colors hover:bg-law-gold/10 hover:text-law-gold"
            >
              <FileText className="h-4 w-4" />
              Gestión RAG
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 transition-colors hover:bg-law-gold/10 hover:text-law-gold"
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Button>
          </Link>
          <Link href="/admin/exams">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 transition-colors hover:bg-law-gold/10 hover:text-law-gold"
            >
              <ClipboardList className="h-4 w-4" />
              Exámenes
            </Button>
          </Link>
          <Link href="/admin/flags">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 transition-colors hover:bg-law-gold/10 hover:text-law-gold"
            >
              <Flag className="h-4 w-4" />
              Reportes
            </Button>
          </Link>
        </nav>

        <div className="border-t border-law-accent/10 p-4">
          <Link href="/chat">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              Volver al Chat
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-law-accent/10 bg-gem-slate p-4 md:hidden">
          <h1 className="flex items-center gap-2 font-serif text-lg text-law-gold">
            <ShieldCheck className="h-5 w-5" />
            Admin Panel
          </h1>
          <AdminMobileSidebar />
        </div>
        {children}
      </main>
    </div>
  );
}
