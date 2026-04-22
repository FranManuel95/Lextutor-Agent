import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64 bg-law-gold/10" />
        <Skeleton className="h-4 w-80 bg-white/5" />
      </div>

      <Card className="border-law-accent/20 bg-gem-slate">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar skeleton */}
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 bg-white/5" />
            <Skeleton className="h-10 w-20 bg-white/5" />
            <Skeleton className="h-10 w-24 bg-white/5" />
            <Skeleton className="h-10 w-28 bg-white/5" />
          </div>

          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 rounded-t border border-white/5 bg-white/5 px-4 py-3">
            {["Usuario", "Email", "Rol", "Fecha", "Acciones"].map((h) => (
              <Skeleton key={h} className="h-4 w-16 bg-law-gold/20" />
            ))}
          </div>

          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                <Skeleton className="h-4 w-24 bg-white/10" />
              </div>
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
              <Skeleton className="h-4 w-28 bg-white/10" />
              <Skeleton className="h-8 w-24 bg-white/5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
