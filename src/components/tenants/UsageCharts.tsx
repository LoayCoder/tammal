import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format } from 'date-fns';
import type { TenantUsage } from '@/hooks/org/useTenantUsage';
import { cardVariants, chartSeries } from "@/theme/tokens";
import { EmptyAnalyticsState } from '@/features/org-dashboard/components/EmptyAnalyticsState';
import { Users, HardDrive } from 'lucide-react';

interface UsageChartsProps {
  history: TenantUsage[];
  isLoading: boolean;
}

export function UsageCharts({ history, isLoading }: UsageChartsProps) {
  const { t } = useTranslation();

  const chartData = history.map((item) => ({
    date: format(new Date(item.period_start), 'MMM yyyy'),
    activeUsers: item.active_users,
    totalUsers: item.total_users,
    storage: Number(item.storage_used_mb),
    apiCalls: item.api_calls,
  }));

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cardVariants.surface}>
          <CardHeader className="p-5 pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-[220px] w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
        <Card className={cardVariants.surface}>
          <CardHeader className="p-5 pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-[220px] w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cardVariants.surface}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>{t('tenantDashboard.userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <EmptyAnalyticsState icon={Users} />
          </CardContent>
        </Card>
        <Card className={cardVariants.surface}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>{t('tenantDashboard.storageUsage')}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <EmptyAnalyticsState icon={HardDrive} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className={cardVariants.surface}>
        <CardHeader className="p-5 pb-3">
          <CardTitle>{t('tenantDashboard.userGrowth')}</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" strokeOpacity={0.8} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="activeUsers" 
                name={t('tenantDashboard.activeUsers')}
                stroke={chartSeries.primary}
                strokeWidth={3}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="totalUsers" 
                name={t('tenantDashboard.totalUsers')}
                stroke={chartSeries.secondary}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className={cardVariants.surface}>
        <CardHeader className="p-5 pb-3">
          <CardTitle>{t('tenantDashboard.storageUsage')}</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartSeries.tertiary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartSeries.tertiary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" strokeOpacity={0.8} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1024).toFixed(1)}GB`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(value: number) => [`${(value / 1024).toFixed(2)} GB`, t('tenantDashboard.storage')]}
              />
              <Area 
                type="monotone" 
                dataKey="storage" 
                name={t('tenantDashboard.storage')}
                stroke={chartSeries.tertiary}
                fill="url(#storageGrad)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
