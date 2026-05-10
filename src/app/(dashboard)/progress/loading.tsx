import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      <div className="z-10 flex-none border-b border-gem-border/40 bg-gem-onyx/80 px-6 backdrop-blur-sm md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-6 md:pb-4 md:pt-8">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6 pt-3 md:px-16">
        <div className="mx-auto max-w-6xl space-y-8 pb-10">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="relative h-40 overflow-hidden rounded-2xl border border-gem-border/40 bg-gem-mist p-6"
              >
                <Skeleton className="mb-4 h-4 w-32" />
                <Skeleton className="h-12 w-24" />
              </div>
            ))}
          </div>

          {/* Distribution & Milestones */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Distribution List */}
            <div className="h-96 rounded-2xl border border-gem-border/40 bg-gem-mist p-6">
              <Skeleton className="mb-6 h-8 w-48" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-4 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="h-96 rounded-2xl border border-gem-border/40 bg-gem-mist p-6">
              <Skeleton className="mb-6 h-8 w-48" />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
