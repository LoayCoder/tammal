import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format } from 'date-fns';
import type { TenantUsage } from '@/hooks/useTenantUsage';

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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('tenantDashboard.userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm text-center py-16">
              {t('common.noData')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('tenantDashboard.storageUsage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm text-center py-16">
              {t('common.noData')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('tenantDashboard.userGrowth')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="activeUsers" 
                name={t('tenantDashboard.activeUsers')}
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="totalUsers" 
                name={t('tenantDashboard.totalUsers')}
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('tenantDashboard.storageUsage')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1024).toFixed(1)}GB`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${(value / 1024).toFixed(2)} GB`, t('tenantDashboard.storage')]}
              />
              <Area 
                type="monotone" 
                dataKey="storage" 
                name={t('tenantDashboard.storage')}
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary) / 0.2)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
