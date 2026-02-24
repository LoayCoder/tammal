import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX, TrendingUp, TrendingDown, SmilePlus, Flame, Percent } from 'lucide-react';
import type { ParticipationStats } from '@/hooks/analytics/useCheckinMonitor';

interface Props {
  stats: ParticipationStats;
  isLoading: boolean;
}

export function CheckinOverview({ stats, isLoading }: Props) {
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

  const moodTrend = stats.avgMoodScoreYesterday !== null
    ? stats.avgMoodScore - stats.avgMoodScoreYesterday
    : null;

  const cards = [
    { label: t('checkinMonitor.stats.totalEmployees'), value: stats.totalEmployees, icon: Users, colorClass: 'text-primary' },
    { label: t('checkinMonitor.stats.checkedIn'), value: stats.checkedInToday, icon: UserCheck, colorClass: 'text-chart-1' },
    { label: t('checkinMonitor.stats.notCheckedIn'), value: stats.notCheckedIn, icon: UserX, colorClass: 'text-muted-foreground' },
    { label: t('checkinMonitor.stats.participationRate'), value: `${stats.participationRate}%`, icon: Percent, colorClass: 'text-chart-2' },
    {
      label: t('checkinMonitor.stats.avgMood'),
      value: stats.avgMoodScore.toFixed(1),
      icon: SmilePlus,
      colorClass: 'text-chart-4',
      suffix: moodTrend !== null ? (
        <span className={`text-xs flex items-center gap-0.5 ${moodTrend >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
          {moodTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {moodTrend > 0 ? '+' : ''}{moodTrend.toFixed(1)}
        </span>
      ) : null,
    },
    { label: t('checkinMonitor.stats.avgStreak'), value: stats.avgStreak.toFixed(1), icon: Flame, colorClass: 'text-chart-3' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, icon: Icon, colorClass, suffix }) => (
        <Card key={label} className="glass-card border-0 rounded-xl">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">{value}</span>
              {(suffix as any) ?? null}
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
