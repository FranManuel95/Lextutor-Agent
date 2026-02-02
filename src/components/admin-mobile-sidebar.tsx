"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShieldCheck, Activity, FileText, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function AdminMobileSidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-law-gold hover:bg-law-gold/10">
                    <Menu className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gem-slate border-r border-law-accent/20 p-0 w-72">
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-law-accent/10">
                        <h1 className="text-xl font-serif text-law-gold flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6" />
                            Admin Panel
                        </h1>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/admin" onClick={() => setOpen(false)}>
                            <Button variant={pathname === "/admin" ? "secondary" : "ghost"} className="w-full justify-start gap-3 hover:bg-law-gold/10 hover:text-law-gold transition-colors">
                                <Activity className="w-4 h-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/admin/rag" onClick={() => setOpen(false)}>
                            <Button variant={pathname.startsWith("/admin/rag") ? "secondary" : "ghost"} className="w-full justify-start gap-3 hover:bg-law-gold/10 hover:text-law-gold transition-colors">
                                <FileText className="w-4 h-4" />
                                Gestión RAG
                            </Button>
                        </Link>
                        <Link href="/admin/users" onClick={() => setOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-law-gold/10 hover:text-law-gold transition-colors" disabled>
                                <Users className="w-4 h-4" />
                                Usuarios (Próximamente)
                            </Button>
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-law-accent/10">
                        <Link href="/chat" onClick={() => setOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
                                <MessageSquare className="w-4 h-4" />
                                Volver al Chat
                            </Button>
                        </Link>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
