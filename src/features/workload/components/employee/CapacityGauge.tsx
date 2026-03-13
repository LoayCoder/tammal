import { useTranslation } from 'react-i18next';

interface CapacityGaugeProps {
  scheduledMinutes: number;
  totalMinutes?: number; // default 480 = 8h
}

export function CapacityGauge({ scheduledMinutes, totalMinutes = 480 }: CapacityGaugeProps) {
  const { t } = useTranslation();
  const pct = Math.min(Math.round((scheduledMinutes / totalMinutes) * 100), 100);
  const hours = (scheduledMinutes / 60).toFixed(1);
  const totalHours = (totalMinutes / 60).toFixed(0);
  const color = pct > 90 ? 'text-destructive' : pct > 70 ? 'text-chart-4' : 'text-chart-1';
  const barColor = pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-chart-4' : 'bg-chart-1';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('commandCenter.capacity')}</span>
        <span className={`font-semibold ${color}`}>{hours}/{totalHours}h</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/30">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{pct}%</span>
        <span className={color}>
          {pct > 90 ? t('commandCenter.overloaded') : pct > 70 ? t('commandCenter.busy') : t('commandCenter.healthy')}
        </span>
      </div>
    </div>
  );
}
