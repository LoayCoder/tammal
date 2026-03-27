import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { type LucideIcon } from 'lucide-react';
import { MetricCard } from '@/components/system';

interface StatCardData {
  title: string;
  value: number;
  icon: LucideIcon;
}

interface TeamStatCardsProps {
  cards: StatCardData[];
  isLoading: boolean;
}

export function TeamStatCards({ cards, isLoading }: TeamStatCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {cards.map(stat => (
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={isLoading ? <Skeleton className="h-7 w-16" /> : stat.value}
          icon={<stat.icon className="h-4 w-4" />}
        />
      ))}
    </div>
  );
}
