import { Skeleton } from "@/components/ui/skeleton"

export function SidebarSkeleton() {
    return (
        <div className="flex flex-col h-full bg-gem-onyx border-r border-law-accent/10 w-80 p-4 gap-4">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-10 w-10 rounded-full bg-law-gold/10" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-white/5" />
                    <Skeleton className="h-3 w-20 bg-white/5" />
                </div>
            </div>

            {/* New Chat Button Skeleton */}
            <Skeleton className="h-10 w-full rounded-xl bg-law-gold/5" />

            {/* Chat List Skeletons */}
            <div className="space-y-3 mt-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 w-full rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
            </div>
        </div>
    )
}
