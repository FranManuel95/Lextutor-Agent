import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      <div className="z-10 flex-none border-b border-gem-border/40 bg-gem-onyx/80 px-6 backdrop-blur-sm md:px-16">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-6 md:pb-4 md:pt-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6 pt-3 md:px-16">
        <div className="mx-auto max-w-6xl space-y-8 pb-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>

          {/* Filters */}
          <Skeleton className="h-16 w-full rounded-xl" />

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gem-border/40 bg-gem-mist">
            <div className="border-b border-gem-border/40 bg-gem-slate p-4">
              <div className="flex justify-between">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-24" />
                ))}
              </div>
            </div>
            <div className="space-y-4 p-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
