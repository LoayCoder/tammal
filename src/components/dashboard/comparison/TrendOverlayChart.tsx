import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// Re-export from canonical location for backward compat
export type { TrendOverlayPoint } from '@/lib/analytics/types';
import type { TrendOverlayPoint } from '@/lib/analytics/types';

interface Props {
  data: TrendOverlayPoint[];
  isLoading: boolean;
}

export function TrendOverlayChart({ data, isLoading }: Props) {
  const { t } = useTranslation();

  const chartData = data.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'dd/MM'),
  }));

  return (
    <Card className="glass-chart border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('synthesis.trendOverlay')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('synthesis.trendOverlayDesc')}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">{t('common.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                domain={[1, 5]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={28}
                label={{ value: t('synthesis.checkinAxis'), angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[1, 5]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={28}
                label={{ value: t('synthesis.surveyAxis'), angle: 90, position: 'insideRight', style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: 12,
                  boxShadow: '0 8px 32px hsl(var(--primary) / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="checkinAvg"
                name={t('synthesis.checkinLine')}
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: 'hsl(var(--primary))' }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="surveyAvg"
                name={t('synthesis.surveyLine')}
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 2, fill: 'hsl(var(--chart-4))' }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
