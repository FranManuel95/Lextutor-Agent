import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="h-full w-full bg-gem-onyx text-gem-offwhite font-sans flex flex-col overflow-hidden">
            <div className="flex-none border-b border-white/5 bg-[#020617]/50 backdrop-blur-sm z-10 px-6 md:px-10">
                <div className="max-w-6xl mx-auto flex justify-between items-center py-6 md:pt-8 md:pb-4">
                    <Skeleton className="h-10 w-48 bg-white/10" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-3 py-6 px-6 md:px-16">
                <div className="max-w-6xl mx-auto space-y-8 pb-10">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gem-mist/20 border border-white/5 p-6 rounded-2xl relative overflow-hidden h-40">
                                <Skeleton className="h-4 w-32 mb-4 bg-white/10" />
                                <Skeleton className="h-12 w-24 bg-white/10" />
                            </div>
                        ))}
                    </div>

                    {/* Distribution & Milestones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Distribution List */}
                        <div className="bg-gray-900/40 rounded-2xl p-6 border border-white/5 h-96">
                            <Skeleton className="h-8 w-48 mb-6 bg-white/10" />
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-24 bg-white/5" />
                                            <Skeleton className="h-4 w-8 bg-white/5" />
                                        </div>
                                        <Skeleton className="h-4 w-full rounded-full bg-white/5" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Milestones */}
                        <div className="bg-gray-900/40 rounded-2xl p-6 border border-white/5 h-96">
                            <Skeleton className="h-8 w-48 mb-6 bg-white/10" />
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/5" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
