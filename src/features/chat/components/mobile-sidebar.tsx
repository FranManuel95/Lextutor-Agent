'use client'

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChatSidebar } from "./chat-sidebar"
import { Chat } from "@/types/chat"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface MobileSidebarProps {
    chats: Chat[]
}

export const MobileSidebar = ({ chats }: MobileSidebarProps) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <div className="md:hidden p-4 border-b border-white/5 bg-[#020617] flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3 text-white">
                        <Menu className="w-6 h-6" />
                        <span className="font-serif italic text-lg text-law-gold">LexTutor Agent</span>
                    </div>
                </div>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r border-law-accent/20 bg-[#020617] w-72">
                <ChatSidebar chats={chats} />
            </SheetContent>
        </Sheet>
    )
}
