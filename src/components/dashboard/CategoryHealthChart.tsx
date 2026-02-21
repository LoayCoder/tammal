import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type { CategoryScore } from '@/hooks/useOrgAnalytics';

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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.categoryHealth')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 44)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 5]}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, _name: string, props: any) => [
                  `${value}/5 (${props.payload.responses} ${t('orgDashboard.responses')})`,
                  t('orgDashboard.avgScore'),
                ]}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
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
