import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Gauge } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { OrgIntelligenceScore } from '@/features/workload';

interface Props {
  score: OrgIntelligenceScore | null | undefined;
  isPending: boolean;
}

const GAUGE_BG = 'hsl(var(--muted))';

export function TammalIndexCard({ score, isPending }: Props) {
  const { t } = useTranslation();
  const tammalScore = score?.score ?? 0;

  const gaugeColor = tammalScore > 70
    ? 'hsl(var(--chart-2))'
    : tammalScore > 40
      ? 'hsl(var(--chart-4))'
      : 'hsl(var(--destructive))';

  // Two-segment gauge: score + remaining
  const gaugeData = [
    { value: tammalScore, fill: gaugeColor },
    { value: 100 - tammalScore, fill: GAUGE_BG },
  ];

  const components = [
    { label: t('executive.alignmentComponent'), value: score?.components?.alignment ?? 0, color: 'hsl(var(--chart-1))' },
    { label: t('executive.velocityComponent'), value: score?.components?.velocity ?? 0, color: 'hsl(var(--chart-2))' },
    { label: t('executive.capacityComponent'), value: score?.components?.capacity_balance ?? 0, color: 'hsl(var(--chart-4))' },
    { label: t('executive.burnoutHealthComponent'), value: score?.components?.burnout_health ?? 0, color: 'hsl(var(--chart-3))' },
  ];

  return (
    <Card className="glass-card border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          {t('executive.tammalIndex')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-[200px]" /> : (
          <div className="grid gap-6 md:grid-cols-5 items-center">
            {/* Gauge */}
            <div className="md:col-span-2 flex justify-center relative">
              <ResponsiveContainer width={200} height={130}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    dataKey="value"
                    cx="50%"
                    cy="100%"
                    innerRadius={60}
                    outerRadius={85}
                    startAngle={180}
                    endAngle={0}
                    cornerRadius={8}
                    stroke="none"
                  >
                    {gaugeData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pb-1">
                <span className="text-4xl font-bold">{tammalScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>

            {/* Component breakdown */}
            <div className="md:col-span-3 grid gap-3 grid-cols-2">
              {components.map(comp => (
                <div key={comp.label} className="p-3 rounded-lg bg-muted/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{comp.label}</span>
                    <span className="text-sm font-bold">{comp.value}%</span>
                  </div>
                  <Progress value={comp.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
