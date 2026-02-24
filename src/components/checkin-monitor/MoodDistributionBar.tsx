import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import type { MoodBreakdownItem } from '@/hooks/analytics/useCheckinMonitor';

interface Props {
  breakdown: MoodBreakdownItem[];
}

// Map known Tailwind semantic color classes to bg equivalents
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

/** Resolve a color value from mood_definitions to a usable style.
 *  If it matches a known Tailwind token, return a className.
 *  Otherwise treat it as a raw CSS color value for inline style. */
function resolveColor(color: string): { className?: string; style?: React.CSSProperties } {
  const bg = colorToBg[color];
  if (bg) return { className: bg };
  // Raw CSS value (hex, hsl, rgb, named color, or a CSS var reference)
  return { style: { backgroundColor: color } };
}

export function MoodDistributionBar({ breakdown }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (breakdown.length === 0) {
    return (
       <Card className="glass-card border-0 rounded-xl">
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
    <Card className="glass-card border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{t('checkinMonitor.moodDistribution')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-6 rounded-full overflow-hidden">
          {breakdown.map(item => {
            const resolved = resolveColor(item.color);
            const displayLabel = isAr ? item.labelAr : item.label;
            return (
              <Tooltip key={item.moodLevel}>
                <TooltipTrigger asChild>
                  <div
                    className={`${resolved.className ?? ''} transition-all`}
                    style={{ width: `${item.percent}%`, ...resolved.style }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <span>{item.emoji} {displayLabel}: {item.count} ({item.percent}%)</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {breakdown.map(item => {
            const displayLabel = isAr ? item.labelAr : item.label;
            return (
              <div key={item.moodLevel} className="flex items-center gap-1.5 text-sm">
                <span>{item.emoji}</span>
                <span className="text-muted-foreground">{displayLabel} ({item.count})</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
