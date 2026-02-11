import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center py-2 bg-gem-onyx">
            {/* Branding Header Skeleton */}
            <div className="mb-8 text-center space-y-2">
                <Skeleton className="h-10 w-64 mx-auto bg-law-gold/10" />
                <Skeleton className="h-4 w-32 mx-auto bg-white/5" />
            </div>

            {/* Card Skeleton */}
            <div className="w-full max-w-[400px] mx-4 border border-law-accent/10 rounded-xl bg-gem-slate/50 p-6 space-y-6">
                {/* Card Header */}
                <div className="space-y-2 text-center">
                    <Skeleton className="h-8 w-32 mx-auto bg-white/10" />
                    <Skeleton className="h-4 w-48 mx-auto bg-white/5" />
                </div>

                {/* Tabs Skeleton */}
                <Skeleton className="h-10 w-full rounded-md bg-white/5" />

                {/* Form Fields */}
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16 bg-white/5" />
                        <Skeleton className="h-10 w-full rounded-md bg-white/5" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16 bg-white/5" />
                        <Skeleton className="h-10 w-full rounded-md bg-white/5" />
                    </div>

                    <Skeleton className="h-10 w-full rounded-md bg-law-gold/20 mt-6" />
                </div>
            </div>
        </div>
    )
}
