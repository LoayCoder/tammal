import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ShieldAlert, Sparkles } from 'lucide-react';
import type { PeriodComparison, EarlyWarning } from '@/lib/wellnessAnalytics';

interface Props {
  healthScore: number;
  periodComparison: PeriodComparison | null;
  warnings: EarlyWarning[];
  isLoading: boolean;
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'hsl(var(--chart-2))' : score >= 40 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))';
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 157} 157`} />
          <line x1="60" y1="55" x2="60" y2="15" stroke={color} strokeWidth="2"
            transform={`rotate(${rotation}, 60, 55)`} />
        </svg>
      </div>
      <span className="text-2xl font-bold mt-1">{score}</span>
      <span className="text-xs text-muted-foreground">/100</span>
    </div>
  );
}

function DeltaIndicator({ value, suffix = '', inverse = false }: { value: number; suffix?: string; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;

  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${isNeutral ? 'text-muted-foreground' : isPositive ? 'text-chart-2' : 'text-destructive'}`}>
      {isNeutral ? <Minus className="h-3 w-3" /> : isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

export function ExecutiveSummary({ healthScore, periodComparison, warnings, isLoading }: Props) {
  const { t } = useTranslation();
  const topWarnings = warnings.slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('orgDashboard.executiveSummary')}</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('orgDashboard.executiveSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Health Gauge */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-2">{t('orgDashboard.healthScore')}</p>
            <HealthGauge score={healthScore} />
          </div>

          {/* Period Comparison */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{t('orgDashboard.periodChange')}</p>
            {periodComparison ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('orgDashboard.teamWellness')}</span>
                  <DeltaIndicator value={periodComparison.moodDelta} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('orgDashboard.participation')}</span>
                  <DeltaIndicator value={periodComparison.participationDelta} suffix="%" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('orgDashboard.riskPct')}</span>
                  <DeltaIndicator value={periodComparison.riskDelta} suffix="%" inverse />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </div>

          {/* Top Alerts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              {t('orgDashboard.criticalAlerts')}
            </p>
            {topWarnings.length > 0 ? topWarnings.map(w => (
              <div key={w.id} className="flex items-start gap-2">
                <Badge variant={w.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0 mt-0.5">
                  {w.severity}
                </Badge>
                <span className="text-xs leading-tight">{w.message}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">{t('orgDashboard.noAlerts')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
