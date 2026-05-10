"use client";

import React from "react";
import Link from "next/link";
import { Menu, Home, History, TrendingUp, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function GlobalNav() {
  const [open, setOpen] = React.useState(false);

  const links = [
    { href: "/chat/new", label: "Chat Tutor", icon: Home },
    { href: "/exams", label: "Historial Evaluaciones", icon: History },
    { href: "/progress", label: "Mi Progreso", icon: TrendingUp },
    { href: "/quiz", label: "Nuevo Test (Quiz)", icon: BookOpen },
    { href: "/exam", label: "Examen Desarrollo", icon: GraduationCap },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl italic">LexTutor Agent</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              <Button variant="ghost" className="h-12 w-full justify-start gap-4 text-base">
                <link.icon className="h-5 w-5 text-gem-muted" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
