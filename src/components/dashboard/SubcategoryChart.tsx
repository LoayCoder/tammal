import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type { SubcategoryScore } from '@/hooks/analytics/useOrgAnalytics';
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, CHART_GRID_STROKE } from '@/config/chart-styles';

interface SubcategoryChartProps {
  data: SubcategoryScore[];
  isLoading: boolean;
}

export function SubcategoryChart({ data, isLoading }: SubcategoryChartProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  if (!isLoading && data.length === 0) return null;

  const chartData = data.map(d => ({
    name: isRTL && d.nameAr ? d.nameAr : d.name,
    category: isRTL && d.categoryNameAr ? d.categoryNameAr : d.categoryName,
    score: d.avgScore,
    color: d.color,
    responses: d.responseCount,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.subcategoryDrilldown')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 36)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 5]}
                tick={CHART_AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={CHART_AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number, _name: string, props: any) => [
                  `${value}/5 (${props.payload.responses} ${t('orgDashboard.responses')})`,
                  props.payload.category,
                ]}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
