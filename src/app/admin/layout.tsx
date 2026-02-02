import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheck, FileText, Users, Activity, LogOut, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile as any).role !== "admin") {
        redirect("/chat?error=forbidden");
    }

    return (
        <div className="flex min-h-screen bg-gem-onyx text-gem-offwhite font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gem-slate border-r border-law-accent/20 hidden md:flex flex-col">
                <div className="p-6 border-b border-law-accent/10">
                    <h1 className="text-xl font-serif text-law-gold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6" />
                        Admin Panel
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin">
                        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-law-gold/10 hover:text-law-gold transition-colors">
                            <Activity className="w-4 h-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/admin/rag">
                        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-law-gold/10 hover:text-law-gold transition-colors">
                            <FileText className="w-4 h-4" />
                            Gestión RAG
                        </Button>
                    </Link>
                    {/* Placeholder for Users */}
                    <Link href="/admin/users">
                        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-law-gold/10 hover:text-law-gold transition-colors" disabled>
                            <Users className="w-4 h-4" />
                            Usuarios (Próximamente)
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-law-accent/10">
                    <Link href="/chat">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
                            <MessageSquare className="w-4 h-4" />
                            Volver al Chat
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
