import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      {/* Header */}
      <div className="z-10 flex-none border-b border-white/5 bg-[#020617]/50 px-4 backdrop-blur-sm sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center sm:py-6 md:pb-4 md:pt-8">
          <Skeleton className="h-9 w-32 bg-white/10" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full bg-white/10" />
            <Skeleton className="h-8 w-20 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl space-y-6 pb-10">
          {/* Info banner */}
          <Skeleton className="h-14 w-full rounded-xl bg-white/5" />

          {/* Ranking rows */}
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-gray-900/20 px-4 py-3"
              >
                <Skeleton className="h-8 w-10 bg-white/5" />
                <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 bg-white/5" />
                  <Skeleton className="h-3 w-20 bg-white/5" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
