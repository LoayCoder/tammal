import React, { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, EyeOff, Eye } from 'lucide-react';
import { SkeletonCards } from '@/shared/loading/Skeletons';
import { cardVariants, typography } from '@/theme/tokens';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggleCard = useCallback((key: string) => {
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHiddenKeys(new Set()), []);

  if (isLoading) {
    return <SkeletonCards count={cards.length || 6} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;
  }

  const visibleCards = cards.filter(c => !hiddenKeys.has(c.title));
  const hasHidden = hiddenKeys.size > 0;

  return (
    <div className="space-y-2">
      {hasHidden && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={showAll}>
            <Eye className="h-3.5 w-3.5" />
            {t('orgDashboard.showAll', 'Show all')} ({hiddenKeys.size})
          </Button>
        </div>
      )}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {visibleCards.map((stat) => (
          <div
            key={stat.title}
            className={`${cardVariants.glass} border-s-4 ${stat.accentColor ?? 'border-primary'} p-5 rounded-2xl hover:-translate-y-0.5 transition-all duration-200 group relative`}
          >
            <button
              onClick={() => toggleCard(stat.title)}
              className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted/50"
              aria-label="Hide card"
            >
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            </button>
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
    </div>
  );
});
