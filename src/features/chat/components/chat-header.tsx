import { Bot } from 'lucide-react';
import { ReportTrigger } from '@/components/infographics/report-trigger';

interface ChatHeaderProps {
    chatId: string;
    title?: string;
}

export function ChatHeader({ chatId, title }: ChatHeaderProps) {
    return (
        <header className="fixed top-14 left-0 w-full z-10 md:static md:top-auto md:w-auto flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5 bg-gem-onyx/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-law-gold to-yellow-600 flex items-center justify-center shadow-lg shadow-law-gold/10">
                    <Bot className="w-6 h-6 text-gem-onyx" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-white tracking-wide">
                        {title || "Tutoría Legal"}
                    </h1>
                    <span className="text-xs text-gem-offwhite/50 font-medium">
                        Derecho Español
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ReportTrigger chatId={chatId} />
            </div>
        </header>
    );
}
