import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full bg-gem-onyx">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-white/5 bg-gem-onyx/80 p-4 md:flex">
        <Skeleton className="h-9 w-full rounded-lg bg-white/10" />
        <div className="mt-2 space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/5" />
          ))}
        </div>
      </div>

      {/* Main chat area skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-16 items-center border-b border-white/5 bg-gem-onyx/50 px-6 backdrop-blur-md">
          <Skeleton className="h-6 w-48 rounded-md bg-white/5" />
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
              <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
              <div
                className={`flex max-w-[80%] flex-1 flex-col space-y-2 ${
                  i % 2 === 0 ? "items-end" : ""
                }`}
              >
                <Skeleton className="h-4 w-3/4 rounded bg-gem-mist/20" />
                <Skeleton className="h-16 w-full rounded-xl bg-gem-mist/20" />
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 p-4">
          <Skeleton className="h-14 w-full rounded-2xl bg-gem-mist/20" />
        </div>
      </div>
    </div>
  );
}
