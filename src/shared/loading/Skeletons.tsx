import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/* ─── Stat cards row ─── */
interface SkeletonCardsProps {
  count?: number;
  columns?: string;
}

export const SkeletonCards = React.memo(function SkeletonCards({
  count = 4,
  columns = 'grid-cols-2 md:grid-cols-4',
}: SkeletonCardsProps) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="glass-stat border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

/* ─── Table rows ─── */
interface SkeletonTableProps {
  rows?: number;
}

export const SkeletonTable = React.memo(function SkeletonTable({ rows = 5 }: SkeletonTableProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
});

/* ─── Chart placeholder ─── */
interface SkeletonChartProps {
  height?: string;
}

export const SkeletonChart = React.memo(function SkeletonChart({
  height = 'h-[280px]',
}: SkeletonChartProps) {
  return <Skeleton className={`${height} w-full rounded-xl`} />;
});

/* ─── Generic list items ─── */
interface SkeletonListProps {
  rows?: number;
}

export const SkeletonList = React.memo(function SkeletonList({ rows = 3 }: SkeletonListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
});
