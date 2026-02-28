import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonCards } from '@/shared/loading/Skeletons';
import type { StatCard } from '../types';

interface Props {
  cards: StatCard[];
  isLoading: boolean;
}

export const StatCards = React.memo(function StatCards({ cards, isLoading }: Props) {
  if (isLoading) {
    return <SkeletonCards count={cards.length || 6} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((stat) => (
        <Card key={stat.title} className="glass-stat border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium truncate">{stat.title}</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <stat.icon className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
