import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gem-onyx py-2">
      {/* Branding Header Skeleton */}
      <div className="mb-8 space-y-2 text-center">
        <Skeleton className="mx-auto h-10 w-64 bg-law-gold/10" />
        <Skeleton className="mx-auto h-4 w-32 bg-gem-slate" />
      </div>

      {/* Card Skeleton */}
      <div className="mx-4 w-full max-w-[400px] space-y-6 rounded-xl border border-law-accent/10 bg-gem-slate/50 p-6">
        {/* Card Header */}
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-32 bg-gem-slate" />
          <Skeleton className="mx-auto h-4 w-48 bg-gem-slate" />
        </div>

        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-full rounded-md bg-gem-slate" />

        {/* Form Fields */}
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 bg-gem-slate" />
            <Skeleton className="h-10 w-full rounded-md bg-gem-slate" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 bg-gem-slate" />
            <Skeleton className="h-10 w-full rounded-md bg-gem-slate" />
          </div>

          <Skeleton className="mt-6 h-10 w-full rounded-md bg-law-gold/20" />
        </div>
      </div>
    </div>
  );
}
