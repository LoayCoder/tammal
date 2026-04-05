import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { TrendIndicator } from '@/components/workload/TrendIndicator';
import type { LucideIcon } from 'lucide-react';
import type { WorkloadTrend } from '@/features/workload/hooks/useWorkloadTrends';

interface KPI {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accentColor: string;
  iconBg: string;
  current: number;
  previous: number;
  higherIsBetter: boolean;
}

interface Props {
  strategicProgress: number;
  utilization: number;
  burnoutRiskCount: number;
  completionRate: number;
  isPending: boolean;
  trends?: WorkloadTrend | null;
}

export function ExecutiveKPIRow({ strategicProgress, utilization, burnoutRiskCount, completionRate, isPending, trends }: Props) {
  const { t } = useTranslation();

  const kpis: KPI[] = [
    {
      title: t('executive.strategicProgress'),
      value: `${strategicProgress}%`,
      icon: Target,
      accentColor: 'border-s-[hsl(var(--kpi-progress))]',
      iconBg: 'bg-[hsl(var(--kpi-progress))]/10 text-[hsl(var(--kpi-progress))]',
      current: trends?.currentCompletion ?? 0,
      previous: trends?.previousCompletion ?? 0,
      higherIsBetter: true,
    },
    {
      title: t('executive.workforceUtilization'),
      value: `${utilization}%`,
      icon: Activity,
      accentColor: 'border-s-[hsl(var(--kpi-utilization))]',
      iconBg: 'bg-[hsl(var(--kpi-utilization))]/10 text-[hsl(var(--kpi-utilization))]',
      current: trends?.currentUtilization ?? 0,
      previous: trends?.previousUtilization ?? 0,
      higherIsBetter: true,
    },
    {
      title: t('executive.burnoutRiskCount'),
      value: burnoutRiskCount,
      icon: AlertTriangle,
      accentColor: 'border-s-[hsl(var(--kpi-risk))]',
      iconBg: 'bg-[hsl(var(--kpi-risk))]/10 text-[hsl(var(--kpi-risk))]',
      current: trends?.currentBurnoutCount ?? 0,
      previous: trends?.previousBurnoutCount ?? 0,
      higherIsBetter: false,
    },
    {
      title: t('teamWorkload.completionRate'),
      value: `${completionRate}%`,
      icon: TrendingUp,
      accentColor: 'border-s-[hsl(var(--kpi-trend))]',
      iconBg: 'bg-[hsl(var(--kpi-trend))]/10 text-[hsl(var(--kpi-trend))]',
      current: trends?.currentVelocity ?? 0,
      previous: trends?.previousVelocity ?? 0,
      higherIsBetter: true,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {kpis.map(kpi => (
        <Card key={kpi.title} className={`border-0 shadow-sm border-s-4 ${kpi.accentColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">{kpi.title}</CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${kpi.iconBg}`}>
              <kpi.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isPending ? <Skeleton className="h-8 w-16" /> : (
              <div>
                <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
                {trends && <TrendIndicator current={kpi.current} previous={kpi.previous} higherIsBetter={kpi.higherIsBetter} className="mt-1" />}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
