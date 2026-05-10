import { Landmark } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gem-onyx p-2 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-gem-border/40 bg-gem-mist shadow-2xl">
        <Landmark className="h-12 w-12 text-gem-muted" />
      </div>

      <h1 className="mb-4 font-serif text-4xl italic tracking-wide text-gem-offwhite">
        Abre un nuevo chat y comienza a aprender con{" "}
        <span className="text-law-gold">Lextutor Agent</span>
      </h1>
    </div>
  );
}
