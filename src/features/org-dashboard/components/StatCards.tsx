import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SkeletonCards } from '@/shared/loading/Skeletons';
import { cardVariants, typography } from '@/theme/tokens';
import type { StatCard } from '../types';

interface Props {
  cards: StatCard[];
  isLoading: boolean;
}

function TrendBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className={`inline-flex items-center gap-0.5 text-2xs font-medium ${isPositive ? 'text-chart-2' : 'text-destructive'}`}>
        <Icon className="h-3 w-3" />
        {isPositive ? '+' : ''}{value}%
      </span>
      {label && <span className="text-2xs text-muted-foreground">{label}</span>}
    </div>
  );
}

export const StatCards = React.memo(function StatCards({ cards, isLoading }: Props) {
  if (isLoading) {
    return <SkeletonCards count={cards.length || 6} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((stat) => (
        <div
          key={stat.title}
          className={`${cardVariants.glass} border-s-4 ${stat.accentColor ?? 'border-primary'} p-5 rounded-2xl hover:-translate-y-0.5 transition-all duration-200`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className={typography.statLabel}>{stat.title}</span>
          </div>
          <p className={typography.metric}>{stat.value}</p>
          {stat.trend != null && stat.trend !== 0 && (
            <TrendBadge value={stat.trend} label={stat.trendLabel} />
          )}
        </div>
      ))}
    </div>
  );
});
