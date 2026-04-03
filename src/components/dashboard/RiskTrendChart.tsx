import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RiskTrendPoint } from '@/hooks/analytics/useOrgAnalytics';
import {
  ResponsiveContainer, ComposedChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cardVariants } from '@/theme/tokens';
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_GRID_STROKE } from '@/config/chart-styles';

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
    <Card className={cardVariants.glass}>
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
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
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