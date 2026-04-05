import { Skeleton } from "@/components/ui/skeleton";

export function PulseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-16 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="rounded-xl bg-muted/5 p-3 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}
