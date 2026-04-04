import { useTranslation } from 'react-i18next';

interface CapacityGaugeProps {
  scheduledMinutes: number;
  totalMinutes?: number;
}

export function CapacityGauge({ scheduledMinutes, totalMinutes = 480 }: CapacityGaugeProps) {
  const { t } = useTranslation();
  const pct = Math.min(Math.round((scheduledMinutes / totalMinutes) * 100), 100);
  const hours = (scheduledMinutes / 60).toFixed(1);
  const totalHours = (totalMinutes / 60).toFixed(0);
  const color = pct > 90 ? 'text-destructive' : pct > 70 ? 'text-chart-4' : 'text-primary';
  const barColor = pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-chart-4' : 'bg-primary';
  const statusKey = pct > 90 ? 'commandCenter.overloaded' : pct > 70 ? 'commandCenter.busy' : 'commandCenter.healthy';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{t('commandCenter.capacity')}</span>
        <span className={`text-xs font-bold tabular-nums ${color}`}>{hours} / {totalHours}h</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xs text-muted-foreground/60 font-bold tabular-nums">{pct}%</span>
        <span className={`text-2xs font-semibold ${color}`}>{t(statusKey)}</span>
      </div>
    </div>
  );
}
