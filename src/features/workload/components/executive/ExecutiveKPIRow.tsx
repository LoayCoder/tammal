import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Target, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KPI {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accentColor: string; // border-s color
  iconBg: string;
}

interface Props {
  strategicProgress: number;
  utilization: number;
  burnoutRiskCount: number;
  completionRate: number;
  isPending: boolean;
}

export function ExecutiveKPIRow({ strategicProgress, utilization, burnoutRiskCount, completionRate, isPending }: Props) {
  const { t } = useTranslation();

  const kpis: KPI[] = [
    {
      title: t('executive.strategicProgress'),
      value: `${strategicProgress}%`,
      icon: Target,
      accentColor: 'border-s-emerald-500',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: t('executive.workforceUtilization'),
      value: `${utilization}%`,
      icon: Activity,
      accentColor: 'border-s-blue-500',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: t('executive.burnoutRiskCount'),
      value: burnoutRiskCount,
      icon: AlertTriangle,
      accentColor: 'border-s-red-500',
      iconBg: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    {
      title: t('teamWorkload.completionRate'),
      value: `${completionRate}%`,
      icon: TrendingUp,
      accentColor: 'border-s-amber-500',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
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
              <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
