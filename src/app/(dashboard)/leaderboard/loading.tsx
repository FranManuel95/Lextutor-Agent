import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      {/* Header */}
      <div className="z-10 flex-none border-b border-gem-border/40 bg-gem-onyx/80 px-4 backdrop-blur-sm sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center sm:py-6 md:pb-4 md:pt-8">
          <Skeleton className="h-9 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl space-y-6 pb-10">
          {/* Info banner */}
          <Skeleton className="h-14 w-full rounded-xl" />

          {/* Ranking rows */}
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-gem-border/40 bg-gem-mist px-4 py-3"
              >
                <Skeleton className="h-8 w-10" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
