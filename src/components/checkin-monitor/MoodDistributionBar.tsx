import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import type { MoodBreakdownItem } from '@/hooks/analytics/useCheckinMonitor';

interface Props {
  breakdown: MoodBreakdownItem[];
}

// Map Tailwind text-* color classes to bg-* for the bar segments
const colorToBg: Record<string, string> = {
  'text-chart-1': 'bg-chart-1',
  'text-chart-2': 'bg-chart-2',
  'text-chart-3': 'bg-chart-3',
  'text-chart-4': 'bg-chart-4',
  'text-chart-5': 'bg-chart-5',
  'text-destructive': 'bg-destructive',
  'text-primary': 'bg-primary',
  'text-muted-foreground': 'bg-muted-foreground',
};

export function MoodDistributionBar({ breakdown }: Props) {
  const { t } = useTranslation();

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('checkinMonitor.moodDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('checkinMonitor.moodDistribution')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-6 rounded-full overflow-hidden">
          {breakdown.map(item => {
            const bgClass = colorToBg[item.color] ?? 'bg-muted';
            return (
              <Tooltip key={item.moodLevel}>
                <TooltipTrigger asChild>
                  <div
                    className={`${bgClass} transition-all`}
                    style={{ width: `${item.percent}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <span>{item.emoji} {item.label}: {item.count} ({item.percent}%)</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {breakdown.map(item => (
            <div key={item.moodLevel} className="flex items-center gap-1.5 text-sm">
              <span>{item.emoji}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
