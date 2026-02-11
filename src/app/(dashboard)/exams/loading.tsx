import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="h-full w-full bg-gem-onyx text-gem-offwhite font-sans flex flex-col overflow-hidden">
            <div className="flex-none border-b border-white/5 bg-[#020617]/50 backdrop-blur-sm z-10 px-6 md:px-16">
                <div className="max-w-6xl mx-auto flex justify-between items-center py-6 md:pt-8 md:pb-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64 bg-white/10" />
                        <Skeleton className="h-4 w-96 bg-white/5" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-3 py-6 px-6 md:px-16">
                <div className="max-w-6xl mx-auto space-y-8 pb-10">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
                        ))}
                    </div>

                    {/* Filters */}
                    <Skeleton className="h-16 w-full rounded-xl bg-white/5" />

                    {/* Table */}
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-gem-mist/10">
                        <div className="bg-white/5 p-4 border-b border-white/5">
                            <div className="flex justify-between">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-6 w-24 bg-white/10" />
                                ))}
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full bg-white/5" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
