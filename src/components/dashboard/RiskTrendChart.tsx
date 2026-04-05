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
import { CHART_AXIS_TICK, CHART_GRID_STROKE } from '@/config/chart-styles';
import { EmptyAnalyticsState } from '@/features/org-dashboard/components/EmptyAnalyticsState';
import { AlertTriangle } from 'lucide-react';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
};

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
    <Card className={`${cardVariants.glass} rounded-2xl`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.riskTrend')}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {isLoading ? (
          <Skeleton className="h-[240px] w-full rounded-xl" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={GLASS_TOOLTIP}
                formatter={(value: number) => [`${value}%`, t('orgDashboard.riskPct')]}
              />
              <ReferenceLine
                y={threshold}
                stroke="hsl(var(--destructive))"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{ value: t('orgDashboard.limit'), position: 'insideTopRight', fill: 'hsl(var(--destructive))', fontSize: 11 }}
              />
              <Area
                type="natural"
                dataKey="riskPct"
                stroke="hsl(var(--destructive))"
                strokeWidth={2.5}
                fill="url(#riskGradient)"
                dot={{ r: 3, fill: 'hsl(var(--destructive))', strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--destructive))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyAnalyticsState icon={AlertTriangle} />
        )}
      </CardContent>
    </Card>
  );
}
