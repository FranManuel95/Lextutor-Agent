"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ShieldCheck,
  Activity,
  FileText,
  Users,
  MessageSquare,
  ClipboardList,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: Activity, exact: true },
  { href: "/admin/rag", label: "Gestión RAG", icon: FileText },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/exams", label: "Exámenes", icon: ClipboardList },
  { href: "/admin/flags", label: "Reportes", icon: Flag },
];

export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-law-gold hover:bg-law-gold/10 md:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-law-accent/20 bg-gem-slate p-0">
        <div className="flex h-full flex-col">
          <div className="border-b border-law-accent/10 p-6">
            <h1 className="flex items-center gap-2 font-serif text-xl text-law-gold">
              <ShieldCheck className="h-6 w-6" />
              Admin Panel
            </h1>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 transition-colors hover:bg-law-gold/10 hover:text-law-gold",
                      active && "bg-law-gold/10 text-law-gold"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-law-accent/10 p-4">
            <Link href="/chat" onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-gray-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
              >
                <MessageSquare className="h-4 w-4" />
                Volver al Chat
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
