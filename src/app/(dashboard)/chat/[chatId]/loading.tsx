import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex flex-col h-full bg-gem-onyx pt-20 md:pt-0">
            {/* Header Skeleton */}
            <div className="h-16 px-6 flex items-center border-b border-light-white/5 bg-gem-onyx/50 backdrop-blur-md">
                <Skeleton className="h-6 w-48 bg-white/5 rounded-md" />
            </div>

            {/* Messages Area Skeleton */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                        <Skeleton className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                        <div className={`space-y-2 flex-1 max-w-[80%] ${i % 2 === 0 ? 'items-end flex flex-col' : ''}`}>
                            <Skeleton className="h-4 w-3/4 bg-white/5 rounded" />
                            <Skeleton className="h-16 w-full bg-white/5 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area Skeleton */}
            <div className="p-4 border-t border-light-white/5">
                <Skeleton className="h-14 w-full rounded-xl bg-white/5" />
            </div>
        </div>
    )
}
