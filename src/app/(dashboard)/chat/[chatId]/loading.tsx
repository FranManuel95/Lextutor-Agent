import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col bg-gem-onyx pt-20 md:pt-0">
      {/* Header Skeleton */}
      <div className="border-light-white/5 flex h-16 items-center border-b bg-gem-onyx/50 px-6 backdrop-blur-md">
        <Skeleton className="h-6 w-48 rounded-md bg-gem-slate" />
      </div>

      {/* Messages Area Skeleton */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-gem-slate" />
            <div
              className={`max-w-[80%] flex-1 space-y-2 ${i % 2 === 0 ? "flex flex-col items-end" : ""}`}
            >
              <Skeleton className="h-4 w-3/4 rounded bg-gem-slate" />
              <Skeleton className="h-16 w-full rounded-xl bg-gem-slate" />
            </div>
          </div>
        ))}
      </div>

      {/* Input Area Skeleton */}
      <div className="border-light-white/5 border-t p-4">
        <Skeleton className="h-14 w-full rounded-xl bg-gem-slate" />
      </div>
    </div>
  );
}
