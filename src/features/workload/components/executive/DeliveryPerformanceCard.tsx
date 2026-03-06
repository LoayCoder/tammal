import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MetricItem {
  label: string;
  value: number | string;
  numericValue: number; // 0-100 for mini donut
  color: string;
}

interface Props {
  avgVelocity: number;
  totalCompleted: number;
  completionRate: number;
  overdueRate: number;
  isPending: boolean;
}

function MiniDonut({ value, color }: { value: number; color: string }) {
  const bg = 'hsl(var(--muted))';
  const data = [
    { value: Math.min(value, 100), fill: color },
    { value: Math.max(100 - value, 0), fill: bg },
  ];
  return (
    <div className="relative h-12 w-12 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={14} outerRadius={22} startAngle={90} endAngle={-270} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeliveryPerformanceCard({ avgVelocity, totalCompleted, completionRate, overdueRate, isPending }: Props) {
  const { t } = useTranslation();

  const metrics: MetricItem[] = [
    { label: t('executive.executionVelocity'), value: avgVelocity, numericValue: Math.min(avgVelocity * 10, 100), color: 'hsl(var(--primary))' },
    { label: t('executive.onTimeCompletion'), value: totalCompleted, numericValue: Math.min(totalCompleted, 100), color: 'hsl(var(--chart-2))' },
    { label: t('teamWorkload.completionRate'), value: `${completionRate}%`, numericValue: completionRate, color: 'hsl(var(--chart-1))' },
    { label: t('teamWorkload.overdueRate'), value: `${overdueRate}%`, numericValue: overdueRate, color: 'hsl(var(--destructive))' },
  ];

  return (
    <Card className="glass-card border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {t('executive.deliveryPerformance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-24" /> : (
          <div className="grid gap-4 md:grid-cols-4">
            {metrics.map(m => (
              <div key={m.label} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <MiniDonut value={m.numericValue} color={m.color} />
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
