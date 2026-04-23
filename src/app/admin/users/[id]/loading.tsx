import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 bg-white/10" />
            <Skeleton className="h-4 w-36 bg-white/5" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 bg-white/10" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3 rounded-xl border border-law-accent/20 bg-gem-slate p-6">
        <Skeleton className="mb-4 h-6 w-32 bg-white/10" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}
