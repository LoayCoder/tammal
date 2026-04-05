import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type { CategoryScore } from '@/hooks/analytics/useOrgAnalytics';
import { cardVariants } from '@/theme/tokens';
import { CHART_AXIS_TICK, CHART_GRID_STROKE } from '@/config/chart-styles';
import { EmptyAnalyticsState } from '@/features/org-dashboard/components/EmptyAnalyticsState';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
};

interface CategoryHealthChartProps {
  data: CategoryScore[];
  isLoading: boolean;
}

export function CategoryHealthChart({ data, isLoading }: CategoryHealthChartProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const chartData = data.map(d => ({
    name: isRTL && d.nameAr ? d.nameAr : d.name,
    score: d.avgScore,
    color: d.color,
    responses: d.responseCount,
  }));

  return (
    <Card className={`${cardVariants.glass} rounded-2xl`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.categoryHealth')}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-xl" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 44)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} strokeOpacity={0.5} />
              <XAxis type="number" domain={[0, 5]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                contentStyle={GLASS_TOOLTIP}
                formatter={(value: number, _name: string, props: any) => [
                  `${value}/5 (${props.payload.responses} ${t('orgDashboard.responses')})`,
                  t('orgDashboard.avgScore'),
                ]}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name ?? index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyAnalyticsState />
        )}
      </CardContent>
    </Card>
  );
}
