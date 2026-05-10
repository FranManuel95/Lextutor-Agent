import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx p-8 font-sans text-gem-offwhite">
      <div className="mx-auto w-full max-w-4xl flex-1">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-9 w-64 bg-white/10" />
        </div>

        {/* Config Card */}
        <div className="rounded-xl border border-law-accent/20 bg-gem-mist/10 p-6">
          <Skeleton className="mb-2 h-6 w-40 bg-white/10" />
          <Skeleton className="mb-6 h-4 w-72 bg-white/5" />

          {/* Area selector pills */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-4 w-16 bg-white/5" />
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-28 rounded-lg bg-white/5" />
              ))}
            </div>
          </div>

          {/* Difficulty selector pills */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-4 w-24 bg-white/5" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-lg bg-white/5" />
              ))}
            </div>
          </div>

          {/* Count selector pills */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-4 w-36 bg-white/5" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-28 rounded-lg bg-white/5" />
              ))}
            </div>
          </div>

          {/* CTA button */}
          <Skeleton className="h-12 w-full rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
}
