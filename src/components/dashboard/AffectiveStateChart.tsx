import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { AffectiveDistribution } from '@/hooks/analytics/useOrgAnalytics';

const STATE_COLORS: Record<string, string> = {
  positive: 'hsl(var(--chart-2))',
  neutral: 'hsl(var(--muted-foreground))',
  negative: 'hsl(var(--destructive))',
};

interface AffectiveStateChartProps {
  data: AffectiveDistribution[];
  isLoading: boolean;
}

export function AffectiveStateChart({ data, isLoading }: AffectiveStateChartProps) {
  const { t } = useTranslation();

  const totalCount = data.reduce((s, d) => s + d.count, 0);

  const chartData = data
    .filter(d => d.count > 0)
    .map(d => ({
      name: t(`orgDashboard.affective.${d.state}`),
      value: d.count,
      percentage: d.percentage,
      fill: STATE_COLORS[d.state],
    }));

  return (
    <Card className="glass-chart border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.affectiveDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : totalCount > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                paddingAngle={3}
                label={({ percentage }) => `${percentage}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [`${value} (${Math.round((value / totalCount) * 100)}%)`, name]}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">{t('orgDashboard.noSurveyData')}</p>
        )}
      </CardContent>
    </Card>
  );
}
