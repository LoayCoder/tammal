import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  objProgress: number;
  initProgress: number;
  isPending: boolean;
}

const GAUGE_BG = 'hsl(var(--muted))';

export function StrategicProgressCard({ objProgress, initProgress, isPending }: Props) {
  const { t } = useTranslation();
  const combined = Math.round((objProgress + initProgress) / 2);

  const gaugeColor = combined > 70
    ? 'hsl(var(--chart-2))'
    : combined > 40
      ? 'hsl(var(--chart-4))'
      : 'hsl(var(--destructive))';

  const gaugeData = [
    { value: combined, fill: gaugeColor },
    { value: 100 - combined, fill: GAUGE_BG },
  ];

  return (
    <Card className="glass-chart border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('executive.strategicOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-[260px] w-full" /> : (
          <div className="flex flex-col items-center">
            <div className="relative w-full" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    dataKey="value"
                    cx="50%"
                    cy="100%"
                    innerRadius={55}
                    outerRadius={80}
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
              <div className="absolute bottom-2 inset-x-0 flex flex-col items-center">
                <span className="text-3xl font-bold">{combined}%</span>
                <span className="text-xs text-muted-foreground">{t('executive.strategicProgress')}</span>
              </div>
            </div>

            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                <span className="text-xs text-muted-foreground">{t('executive.objectives')}: {objProgress}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                <span className="text-xs text-muted-foreground">{t('executive.initiatives')}: {initProgress}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
