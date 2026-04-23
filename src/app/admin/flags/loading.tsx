import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 bg-white/10" />
          <Skeleton className="h-4 w-72 bg-white/5" />
        </div>
        <Skeleton className="h-9 w-32 bg-white/10" />
      </div>

      <div className="space-y-4 rounded-xl border border-law-accent/20 bg-gem-slate p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-36 bg-white/10" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
