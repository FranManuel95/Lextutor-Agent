"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gem-offwhite hover:bg-gem-slate md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] border-r border-law-accent/20 bg-gem-onyx sm:w-[400px]"
      >
        <nav className="mt-8 flex flex-col gap-6">
          <div className="mb-4">
            <span className="font-serif text-2xl italic text-gem-offwhite">
              LexTutor <span className="text-law-gold">Agent</span>
            </span>
          </div>

          <Link
            href="#"
            onClick={() => setOpen(false)}
            className="text-lg font-medium text-gem-offwhite transition-colors hover:text-law-gold"
          >
            Características
          </Link>
          <Link
            href="#"
            onClick={() => setOpen(false)}
            className="text-lg font-medium text-gem-offwhite transition-colors hover:text-law-gold"
          >
            Sobre Nosotros
          </Link>
          <Link
            href="#"
            onClick={() => setOpen(false)}
            className="text-lg font-medium text-gem-offwhite transition-colors hover:text-law-gold"
          >
            Seguridad
          </Link>
          <Link
            href="#"
            onClick={() => setOpen(false)}
            className="text-lg font-medium text-gem-offwhite transition-colors hover:text-law-gold"
          >
            Contacto
          </Link>
          <div className="mt-auto pt-8">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button className="w-full bg-law-gold py-6 text-lg font-bold uppercase tracking-wide text-white hover:bg-law-gold/90 dark:text-gem-onyx">
                Acceder
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
