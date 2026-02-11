import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex flex-col h-screen items-center justify-center bg-gem-onyx space-y-4">
            <div className="bg-law-gold/10 p-4 rounded-full animate-pulse">
                <Loader2 className="h-8 w-8 text-law-gold animate-spin" />
            </div>
            <p className="text-gem-offwhite/60 font-medium text-sm animate-pulse">
                Cargando Estudiante Elite...
            </p>
        </div>
    )
}
