import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { AffectiveDistribution } from '@/hooks/analytics/useOrgAnalytics';
import { cardVariants } from '@/theme/tokens';
import { EmptyAnalyticsState } from '@/features/org-dashboard/components/EmptyAnalyticsState';

const STATE_COLORS: Record<string, string> = {
  positive: 'hsl(var(--chart-2))',
  neutral: 'hsl(var(--muted-foreground))',
  negative: 'hsl(var(--destructive))',
};

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
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
    <Card className={`${cardVariants.glass} rounded-2xl`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.affectiveDistribution')}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full rounded-xl" />
        ) : totalCount > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
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
                  <Cell key={entry.name ?? index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={GLASS_TOOLTIP}
                formatter={(value: number, name: string) => [`${value} (${Math.round((value / totalCount) * 100)}%)`, name]}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyAnalyticsState />
        )}
      </CardContent>
    </Card>
  );
}
