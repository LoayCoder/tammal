import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ShieldAlert, BarChart3, Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import type { PeriodComparison, EarlyWarning } from '@/lib/analytics/types';
import { cardVariants, typography } from '@/theme/tokens';
import { cn } from '@/lib/utils';

interface Props {
  healthScore: number;
  periodComparison: PeriodComparison | null;
  warnings: EarlyWarning[];
  isLoading: boolean;
}

/* ── Semi-circle Gauge ── */
function HealthGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'hsl(var(--chart-2))' :
    score >= 40 ? 'hsl(var(--chart-4))' :
    'hsl(var(--destructive))';

  const data = [
    { value: score, fill: color },
    { value: 100 - score, fill: 'hsl(var(--muted))' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-[72px] overflow-hidden">
        <PieChart width={144} height={144}>
          <Pie
            data={data}
            cx={72}
            cy={72}
            startAngle={180}
            endAngle={0}
            innerRadius={48}
            outerRadius={68}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </div>
      <span className={cn(typography.metric, 'text-3xl -mt-2')}>{score}</span>
      <span className="text-xs text-muted-foreground">/100</span>
    </div>
  );
}

/* ── Delta Pill ── */
function DeltaPill({ label, value, suffix = '', inverse = false }: { label: string; value: number; suffix?: string; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <span className={cn(
        'inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full',
        isNeutral ? 'bg-muted text-muted-foreground' :
        isPositive ? 'bg-chart-2/10 text-chart-2' :
        'bg-destructive/10 text-destructive'
      )}>
        {isNeutral ? <Minus className="h-3 w-3" /> : isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {value > 0 ? '+' : ''}{value}{suffix}
      </span>
    </div>
  );
}

/* ── Key Insight Generator ── */
function generateKeyInsight(pc: PeriodComparison | null, warnings: EarlyWarning[], t: (k: string) => string): string {
  if (!pc) return t('orgDashboard.noDataForInsight');
  const parts: string[] = [];
  if (pc.moodDelta > 0) parts.push(t('orgDashboard.insight.moodUp'));
  else if (pc.moodDelta < 0) parts.push(t('orgDashboard.insight.moodDown'));
  if (pc.participationDelta > 0) parts.push(t('orgDashboard.insight.participationUp'));
  else if (pc.participationDelta < -10) parts.push(t('orgDashboard.insight.participationLow'));
  if (pc.riskDelta > 5) parts.push(t('orgDashboard.insight.riskRising'));
  else if (pc.riskDelta < 0) parts.push(t('orgDashboard.insight.riskImproving'));
  if (warnings.length > 3) parts.push(t('orgDashboard.insight.manyWarnings'));
  return parts.length > 0 ? parts.join('. ') + '.' : t('orgDashboard.insight.stable');
}

export function ExecutiveSummary({ healthScore, periodComparison, warnings, isLoading }: Props) {
  const { t } = useTranslation();
  const topWarnings = warnings.slice(0, 3);

  if (isLoading) {
    return (
      <Card className={cardVariants.premium}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('orgDashboard.executiveSummary')}</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-40 w-full rounded-xl" /></CardContent>
      </Card>
    );
  }

  const insight = generateKeyInsight(periodComparison, warnings, t);

  return (
    <Card className={cn(cardVariants.premium, 'p-6')}>
      <CardHeader className="pb-3 px-0 pt-0">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          {t('orgDashboard.executiveSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Health Gauge */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-3">{t('orgDashboard.healthScore')}</p>
            <HealthGauge score={healthScore} />
          </div>

          {/* Period Comparison */}
          <div>
            <p className={cn(typography.statLabel, 'mb-2')}>{t('orgDashboard.periodChange')}</p>
            {periodComparison ? (
              <div className="divide-y divide-border/50">
                <DeltaPill label={t('orgDashboard.teamWellness')} value={periodComparison.moodDelta} />
                <DeltaPill label={t('orgDashboard.participation')} value={periodComparison.participationDelta} suffix="%" />
                <DeltaPill label={t('orgDashboard.riskPct')} value={periodComparison.riskDelta} suffix="%" inverse />
              </div>
            ) : (
              <p className={typography.subtitle}>{t('common.noData')}</p>
            )}
          </div>

          {/* Top Alerts */}
          <div>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
              <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t('orgDashboard.criticalAlerts')}
            </p>
            {topWarnings.length > 0 ? (
              <div className="space-y-2.5">
                {topWarnings.map(w => (
                  <div key={w.id} className="flex items-start gap-2">
                    <div className={cn(
                      'mt-1 h-2 w-2 rounded-full shrink-0',
                      w.severity === 'high' ? 'bg-destructive' : 'bg-chart-4'
                    )} />
                    <span className="text-xs leading-relaxed">{w.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('orgDashboard.noAlerts')}</p>
            )}
          </div>
        </div>

        {/* Key Insight */}
        <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-xs text-foreground/80 leading-relaxed">{insight}</p>
        </div>
      </CardContent>
    </Card>
  );
}
