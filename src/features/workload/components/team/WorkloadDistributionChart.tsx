import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
};

interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
}

interface WorkloadDistributionChartProps {
  data: ChartDataItem[];
  isLoading: boolean;
}

export function WorkloadDistributionChart({ data, isLoading }: WorkloadDistributionChartProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-chart border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {t('teamWorkload.workloadDistribution')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[200px]" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={GLASS_TOOLTIP} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
