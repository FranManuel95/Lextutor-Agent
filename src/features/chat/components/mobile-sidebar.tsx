'use client'

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChatSidebar } from "./chat-sidebar"
import { Chat } from "@/types/chat"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface MobileSidebarProps {
    chats: Chat[]
}

export const MobileSidebar = ({ chats }: MobileSidebarProps) => {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Auto-close sidebar when navigating to a different page/chat
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    const handleClose = () => {
        setOpen(false)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div className="md:hidden p-4 border-b border-white/5 bg-[#020617] flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3 text-white">
                        <Menu className="w-6 h-6" />
                        <span className="font-serif italic text-lg text-law-gold">LexTutor Agent</span>
                    </div>
                </div>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r border-law-accent/20 bg-[#020617] w-72">
                <ChatSidebar chats={chats} onClose={handleClose} />
            </SheetContent>
        </Sheet>
    )
}
