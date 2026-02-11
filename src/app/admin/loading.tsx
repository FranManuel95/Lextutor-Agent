import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex flex-col h-screen bg-gem-onyx">
            {/* Admin Header Skeleton */}
            <div className="h-16 border-b border-law-accent/10 px-6 flex items-center justify-between">
                <Skeleton className="h-6 w-32 bg-law-gold/10" />
                <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Admin Sidebar Skeleton */}
                <div className="w-64 border-r border-law-accent/10 hidden md:block p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg bg-white/5" />
                    ))}
                </div>

                {/* Main Content Skeleton */}
                <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl bg-white/5 border border-white/5" />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48 bg-white/10" />
                        <div className="rounded-xl border border-white/5 overflow-hidden">
                            <div className="h-12 bg-white/5 border-b border-white/5" />
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 border-b border-white/5 bg-transparent" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
