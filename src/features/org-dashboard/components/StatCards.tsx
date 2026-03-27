import React from 'react';
import { SkeletonCards } from '@/shared/loading/Skeletons';
import { MetricCard } from '@/components/system';
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
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={<stat.icon className="h-3.5 w-3.5 text-primary" />}
        />
      ))}
    </div>
  );
});
