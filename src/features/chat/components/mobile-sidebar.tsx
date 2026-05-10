"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatSidebar } from "./chat-sidebar";
import { Chat } from "@/types/chat";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileSidebarProps {
  chats: Chat[];
}

export const MobileSidebar = ({ chats }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar when navigating to a different page/chat
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-law-dark p-4 md:hidden">
          <div className="flex items-center gap-3 text-white">
            <Menu className="h-6 w-6" />
            <span className="font-serif text-lg italic text-law-gold">LexTutor Agent</span>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-law-accent/20 bg-law-dark p-0">
        <ChatSidebar chats={chats} onClose={handleClose} />
      </SheetContent>
    </Sheet>
  );
};
