import { Bot } from "lucide-react";
import { ReportTrigger } from "@/components/infographics/report-trigger";

interface ChatHeaderProps {
  chatId: string;
  title?: string;
}

export function ChatHeader({ chatId, title }: ChatHeaderProps) {
  return (
    <header className="fixed left-0 top-14 z-10 flex w-full items-center justify-between border-b border-gem-border/40 bg-gem-onyx/80 px-4 py-4 backdrop-blur-sm md:static md:top-auto md:w-auto md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-law-gold to-amber-700 shadow-lg shadow-law-gold/10">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-wide text-gem-offwhite">
            {title || "Tutoría Legal"}
          </h1>
          <span className="text-xs font-medium text-gem-muted">Derecho Español</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ReportTrigger chatId={chatId} />
      </div>
    </header>
  );
}
