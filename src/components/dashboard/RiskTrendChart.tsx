import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RiskTrendPoint } from '@/hooks/analytics/useOrgAnalytics';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface Props {
  data: RiskTrendPoint[];
  isLoading: boolean;
  threshold?: number;
}

export function RiskTrendChart({ data, isLoading, threshold = 20 }: Props) {
  const { t } = useTranslation();

  const chartData = data
    .filter(d => d.totalEntries > 0)
    .map(d => ({ ...d, label: format(parseISO(d.date), 'dd/MM') }));

  return (
    <Card className="glass-chart border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.riskTrend')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12, boxShadow: '0 8px 32px hsl(var(--primary) / 0.1)' }}
                formatter={(value: number) => [`${value}%`, t('orgDashboard.riskPct')]}
                labelFormatter={(label) => label}
              />
              <ReferenceLine
                y={threshold}
                stroke="hsl(var(--destructive))"
                strokeDasharray="6 4"
                strokeWidth={2}
                label={{ value: t('orgDashboard.limit'), position: 'insideTopRight', fill: 'hsl(var(--destructive))', fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="riskPct"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                fill="url(#riskGradient)"
                dot={{ r: 3, fill: 'hsl(var(--destructive))', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
