import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 bg-white/10" />
          <Skeleton className="h-4 w-80 bg-white/5" />
        </div>
        <Skeleton className="h-9 w-32 bg-white/10" />
      </div>

      <div className="space-y-4 rounded-xl border border-law-accent/20 bg-gem-slate p-6">
        <Skeleton className="h-6 w-40 bg-white/10" />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
