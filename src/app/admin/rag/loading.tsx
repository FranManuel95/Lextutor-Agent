import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gem-onyx p-8 font-sans">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/5" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-md bg-white/5" />
            <Skeleton className="h-9 w-32 rounded-md bg-white/5" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Upload area skeleton */}
          <div className="rounded-xl border border-law-accent/30 bg-gem-slate/50 p-6">
            <Skeleton className="mb-6 h-6 w-48 bg-white/10" />
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-law-accent/30 bg-gem-onyx/50 p-10">
              <Skeleton className="mb-4 h-10 w-10 rounded-full bg-white/10" />
              <Skeleton className="mb-2 h-5 w-32 bg-white/10" />
              <Skeleton className="h-4 w-40 bg-white/5" />
            </div>
            <Skeleton className="mt-6 h-12 w-full rounded-lg bg-white/10" />
          </div>

          {/* Documents list skeleton */}
          <div className="rounded-xl border border-law-accent/30 bg-gem-slate/50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-6 w-44 bg-white/10" />
              <Skeleton className="h-8 w-8 rounded-md bg-white/5" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-law-accent/10 bg-gem-onyx/40 p-4"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-lg bg-white/5" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40 bg-white/10" />
                      <Skeleton className="h-3 w-24 bg-white/5" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
