import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DayOfWeekActivity } from '@/hooks/analytics/useOrgAnalytics';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

interface ResponseHeatmapProps {
  data: DayOfWeekActivity[];
  isLoading: boolean;
}

export function ResponseHeatmap({ data, isLoading }: ResponseHeatmapProps) {
  const { t } = useTranslation();

  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-muted';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-primary';
    if (ratio > 0.5) return 'bg-primary/70';
    if (ratio > 0.25) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.responseHeatmap')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[80px] w-full" />
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {data.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  {t(`orgDashboard.days.${DAY_KEYS[d.day]}`)}
                </span>
                <div
                  className={cn(
                    'w-full aspect-square rounded-md flex items-center justify-center text-xs font-semibold transition-colors',
                    getIntensity(d.count),
                    d.count > 0 ? 'text-primary-foreground' : 'text-muted-foreground',
                  )}
                >
                  {d.count}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
