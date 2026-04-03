import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type { CategoryScore } from '@/hooks/analytics/useOrgAnalytics';
import { cardVariants } from '@/theme/tokens';
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_GRID_STROKE } from '@/config/chart-styles';

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
    <Card className={cardVariants.glass}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.categoryHealth')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 44)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
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
          <p className="text-muted-foreground text-sm text-center py-10">{t('orgDashboard.noSurveyData')}</p>
        )}
      </CardContent>
    </Card>
  );
}