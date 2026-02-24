import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Users, Clock, CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import type { SurveyParticipationStats } from '@/hooks/analytics/useSurveyMonitor';

interface Props {
  stats?: SurveyParticipationStats;
  isLoading: boolean;
}

const statCards = [
  { key: 'totalTargeted' as const, icon: Users, colorClass: 'text-primary' },
  { key: 'notStarted' as const, icon: Clock, colorClass: 'text-muted-foreground' },
  { key: 'inProgress' as const, icon: TrendingUp, colorClass: 'text-chart-4' },
  { key: 'completed' as const, icon: CheckCircle, colorClass: 'text-chart-1' },
  { key: 'expired' as const, icon: AlertTriangle, colorClass: 'text-destructive' },
  { key: 'completionPercent' as const, icon: XCircle, colorClass: 'text-primary' },
] as const;

export function ParticipationOverview({ stats, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map(({ key, icon: Icon, colorClass }) => (
        <Card key={key}>
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <Icon className={`h-5 w-5 ${colorClass}`} />
            <span className="text-2xl font-bold">
              {key === 'completionPercent' ? `${stats[key]}%` : stats[key]}
            </span>
            <span className="text-xs text-muted-foreground">
              {t(`surveyMonitor.stats.${key}`)}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
