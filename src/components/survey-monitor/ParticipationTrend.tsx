import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendPoint } from '@/hooks/analytics/useSurveyMonitor';
import { format, parseISO } from 'date-fns';

interface Props {
  trendData: TrendPoint[];
  isLoading: boolean;
}

export function ParticipationTrend({ trendData, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('surveyMonitor.participationTrend')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          {t('surveyMonitor.noTrendData')}
        </CardContent>
      </Card>
    );
  }

  const chartData = trendData.map(p => ({
    ...p,
    label: format(parseISO(p.date), 'MMM dd'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('surveyMonitor.participationTrend')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
            <YAxis yAxisId="left" domain={[0, 'auto']} className="text-xs fill-muted-foreground" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" className="text-xs fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--popover-foreground))',
                borderRadius: 8,
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulativeCompleted"
              name={t('surveyMonitor.stats.employeesCompleted')}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="completionPercent"
              name={t('surveyMonitor.stats.completionPercent')}
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
