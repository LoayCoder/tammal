import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { StreakBucket } from '@/hooks/analytics/useOrgAnalytics';
import { EmptyAnalyticsState } from '@/features/org-dashboard/components/EmptyAnalyticsState';

interface Props {
  data: StreakBucket[];
  isLoading: boolean;
}

export function StreakDistribution({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const hasData = data.some(d => d.count > 0);

  const chartData = data.map(d => ({
    bucket: t(`orgDashboard.streakBucket.${d.bucket}`, `${d.bucket} days`),
    count: d.count,
  }));

  return (
    <Card className="glass-chart">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-base">{t('orgDashboard.streakDistribution')}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="count" name={t('orgDashboard.employees')} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyAnalyticsState />
        )}
      </CardContent>
    </Card>
  );
}
