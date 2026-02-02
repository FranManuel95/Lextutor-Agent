import { Landmark } from 'lucide-react'

export default function ChatPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-2 bg-gem-onyx">
            <div className="w-24 h-24 bg-gem-mist/20 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                <Landmark className="text-gray-400 w-12 h-12" />
            </div>

            <h1 className="text-4xl font-serif italic text-white mb-4 tracking-wide">
                Abre un nuevo chat y comienza a aprender con <span className="text-law-gold">Lextutor Agent</span>
            </h1>


        </div>
    )
}
