import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Zap, Heart } from 'lucide-react';
import type { CheckinPulseMetrics } from '@/lib/synthesisEngine';

interface Props {
  data: CheckinPulseMetrics | null;
  isLoading: boolean;
}

export function CheckinPulseCard({ data, isLoading }: Props) {
  const { t } = useTranslation();

  const TrendIcon = data?.energyTrend === 'up' ? TrendingUp : data?.energyTrend === 'down' ? TrendingDown : Minus;
  const trendColor = data?.energyTrend === 'up' ? 'text-emerald-500' : data?.energyTrend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  const metrics = [
    {
      label: t('synthesis.volatilityIndex'),
      value: data?.volatilityIndex?.toFixed(2) ?? '—',
      icon: Activity,
      highlight: (data?.volatilityIndex ?? 0) > 1.0,
    },
    {
      label: t('synthesis.participationStability'),
      value: data ? `${Math.round((1 - data.participationStability) * 100)}%` : '—',
      icon: BarChart3,
    },
    {
      label: t('synthesis.energyTrend'),
      value: t(`synthesis.trend.${data?.energyTrend ?? 'stable'}`),
      icon: Zap,
      customIcon: <TrendIcon className={`h-4 w-4 ${trendColor}`} />,
    },
    {
      label: t('synthesis.topEmotion'),
      value: data ? t(`orgDashboard.moods.${data.topEmotionCluster}`, data.topEmotionCluster) : '—',
      icon: Heart,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {t('synthesis.checkinPulse')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('synthesis.checkinPulseDesc')}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <p className="text-xs text-muted-foreground truncate">{m.label}</p>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="flex items-center gap-1.5">
                {m.customIcon ?? <m.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-lg font-semibold">{m.value}</span>
                {m.highlight && <Badge variant="destructive" className="text-[10px] px-1 py-0">!</Badge>}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
