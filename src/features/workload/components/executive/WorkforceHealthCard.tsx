import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
} from 'recharts';
import type { InitiativeRiskMetric } from '@/features/workload';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
};

const HEATMAP_COLORS: Record<string, string> = {
  underutilized: 'hsl(var(--chart-1))',
  healthy: 'hsl(var(--chart-2))',
  high_load: 'hsl(var(--chart-4))',
  burnout_risk: 'hsl(var(--destructive))',
};

interface Props {
  distribution: { underutilized: number; healthy: number; high_load: number; burnout_risk: number };
  heatmapLoading: boolean;
  riskMetrics: InitiativeRiskMetric[];
  riskLoading: boolean;
  initMap: Record<string, string>;
}

export function WorkforceHealthCard({ distribution, heatmapLoading, riskMetrics, riskLoading, initMap }: Props) {
  const { t } = useTranslation();

  const heatmapChart = [
    { name: t('executive.underutilized'), value: distribution.underutilized, fill: HEATMAP_COLORS.underutilized },
    { name: t('executive.healthy'), value: distribution.healthy, fill: HEATMAP_COLORS.healthy },
    { name: t('executive.highLoad'), value: distribution.high_load, fill: HEATMAP_COLORS.high_load },
    { name: t('executive.burnoutRiskLabel'), value: distribution.burnout_risk, fill: HEATMAP_COLORS.burnout_risk },
  ];

  const hasHeatmap = heatmapChart.some(h => h.value > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Heatmap Pie */}
      <Card className="glass-card border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('executive.heatmapTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {heatmapLoading ? <Skeleton className="h-[220px]" /> : hasHeatmap ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={heatmapChart} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} stroke="none" cornerRadius={4}>
                    {heatmapChart.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={GLASS_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {heatmapChart.map(h => (
                  <div key={h.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: h.fill }} />
                    <span className="text-xs text-muted-foreground">{h.name}: {h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">{t('executive.noHeatmapData')}</p>
          )}
        </CardContent>
      </Card>

      {/* Initiative Risk */}
      <Card className="glass-card border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-destructive" />
            {t('executive.initiativeRiskRadar')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riskLoading ? <Skeleton className="h-[220px]" /> : riskMetrics.length > 0 ? (
            <div className="space-y-3">
              {riskMetrics.slice(0, 5).map(r => (
                <div key={r.initiative_id} className="space-y-1.5 p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{initMap[r.initiative_id] ?? r.initiative_id}</span>
                    <Badge variant={r.risk_score > 60 ? 'destructive' : r.risk_score > 30 ? 'secondary' : 'default'} className="text-xs">
                      {r.risk_score}%
                    </Badge>
                  </div>
                  <Progress value={r.risk_score} className="h-1.5" />
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{t('executive.overdueRisk')}: {r.overdue_score}%</span>
                    <span>{t('executive.velocityRisk')}: {r.velocity_score}%</span>
                    <span>{t('executive.resourceRisk')}: {r.resource_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">{t('executive.noRiskData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
