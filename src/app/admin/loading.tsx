import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen flex-col bg-gem-onyx">
      {/* Admin Header Skeleton */}
      <div className="flex h-16 items-center justify-between border-b border-law-accent/10 px-6">
        <Skeleton className="h-6 w-32 bg-law-gold/10" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar Skeleton */}
        <div className="hidden w-64 space-y-4 border-r border-law-accent/10 p-4 md:block">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg bg-gem-slate" />
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 space-y-8 overflow-y-auto p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-32 rounded-xl border border-gem-border/40 bg-gem-slate"
              />
            ))}
          </div>

          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="overflow-hidden rounded-xl border border-gem-border/40">
              <div className="h-12 border-b border-gem-border/40 bg-gem-slate" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 border-b border-gem-border/40 bg-transparent" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
