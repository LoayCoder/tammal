import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { CheckinTrendPoint } from '@/hooks/analytics/useCheckinMonitor';

interface Props {
  trendData: CheckinTrendPoint[];
  isLoading: boolean;
}

export function CheckinTrendChart({ trendData, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (trendData.length === 0) {
    return (
       <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">{t('checkinMonitor.trendChart')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          {t('common.noData')}
        </CardContent>
      </Card>
    );
  }

  const chartData = trendData.map(p => ({
    ...p,
    label: format(parseISO(p.date), 'MMM dd'),
  }));

  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{t('checkinMonitor.trendChart')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
            <YAxis yAxisId="mood" domain={[0, 5]} className="text-xs fill-muted-foreground" />
            <YAxis yAxisId="count" orientation="right" className="text-xs fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--popover-foreground))',
                borderRadius: 8,
              }}
            />
            <Area
              yAxisId="mood"
              type="monotone"
              dataKey="avgMood"
              name={t('checkinMonitor.stats.avgMood')}
              fill="hsl(var(--primary) / 0.15)"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="participationCount"
              name={t('checkinMonitor.stats.checkedIn')}
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
