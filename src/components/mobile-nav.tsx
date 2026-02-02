'use client'

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function MobileNav() {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gem-onyx border-r border-law-accent/20 w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-6 mt-8">
                    <div className="mb-4">
                        <span className="font-serif italic text-2xl text-white">
                            LexTutor <span className="text-law-gold">Agent</span>
                        </span>
                    </div>

                    <Link
                        href="#"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium text-gem-offwhite hover:text-law-gold transition-colors"
                    >
                        Características
                    </Link>
                    <Link
                        href="#"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium text-gem-offwhite hover:text-law-gold transition-colors"
                    >
                        Sobre Nosotros
                    </Link>
                    <Link
                        href="#"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium text-gem-offwhite hover:text-law-gold transition-colors"
                    >
                        Seguridad
                    </Link>
                    <Link
                        href="#"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium text-gem-offwhite hover:text-law-gold transition-colors"
                    >
                        Contacto
                    </Link>
                    <div className="pt-8 mt-auto">
                        <Link href="/login" onClick={() => setOpen(false)}>
                            <Button className="w-full bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold tracking-wide uppercase py-6 text-lg">
                                Acceder
                            </Button>
                        </Link>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    )
}
