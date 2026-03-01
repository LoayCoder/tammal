import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { GovernanceSummaryRow } from '@/hooks/ai-governance/useGovernanceSummary';
import type { CostDailyRow } from '@/hooks/ai-governance/useCostBreakdown';

interface Props {
  summary: GovernanceSummaryRow[];
  costData: CostDailyRow[];
  budgetConfig: Record<string, unknown> | null;
  isLoading: boolean;
}

function riskBadge(level: string | null) {
  if (!level) return <Badge variant="outline">N/A</Badge>;
  const colors: Record<string, string> = {
    low: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
    medium: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
    high: 'bg-destructive/20 text-destructive border-destructive/30',
  };
  return <Badge className={colors[level] ?? ''} variant="outline">{level.toUpperCase()}</Badge>;
}

export function GovernanceOverview({ summary, costData, budgetConfig, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-24" /></CardContent></Card>
        ))}
      </div>
    );
  }

  // Aggregate KPIs from summary rows
  const firstRow = summary[0];
  const projectedCost = firstRow?.projected_monthly_cost ?? 0;
  const burnRate = firstRow?.burn_rate ?? 0;
  const slaRisk = firstRow?.sla_risk_level ?? 'low';
  const driftScore = firstRow?.performance_drift_score ?? 0;
  const strategy = (budgetConfig?.routing_strategy as string) ?? 'cost_aware';
  const budget = (budgetConfig?.monthly_budget as number) ?? 0;
  const budgetUtilization = budget > 0 ? ((projectedCost / budget) * 100).toFixed(1) : 'N/A';

  // Provider dominance
  const totalUsage = summary.reduce((s, r) => s + (r.usage_percentage ?? 0), 0);
  const dominantProvider = summary.reduce((best, r) =>
    (r.usage_percentage ?? 0) > (best.usage_percentage ?? 0) ? r : best
  , summary[0]);
  const dominancePct = totalUsage > 0 && dominantProvider
    ? ((dominantProvider.usage_percentage ?? 0) / totalUsage * 100).toFixed(0)
    : '0';

  // Cost trend for chart
  const costByDate = costData.reduce<Record<string, number>>((acc, r) => {
    acc[r.date] = (acc[r.date] ?? 0) + r.total_cost;
    return acc;
  }, {});
  const chartData = Object.entries(costByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cost]) => ({ date, cost: Number(cost.toFixed(4)) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.strategy')}</CardTitle></CardHeader>
          <CardContent><Badge variant="secondary" className="text-base">{strategy}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.projectedCost')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${projectedCost.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.budgetRisk')}</CardTitle></CardHeader>
          <CardContent>
            {riskBadge(Number(budgetUtilization) > 90 ? 'high' : Number(budgetUtilization) > 70 ? 'medium' : 'low')}
            <p className="text-sm text-muted-foreground mt-1">{budgetUtilization}% {t('aiGovernance.utilized')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.slaRisk')}</CardTitle></CardHeader>
          <CardContent>{riskBadge(slaRisk)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.burnRate')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${burnRate.toFixed(4)}<span className="text-sm text-muted-foreground">/day</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.dominantProvider')}</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{dominantProvider?.provider ?? 'N/A'} <span className="text-muted-foreground">({dominancePct}%)</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.performanceDrift')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{(driftScore * 100).toFixed(1)}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.totalCalls24h')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.reduce((s, r) => s + (r.calls_last_24h ?? 0), 0)}</p></CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t('aiGovernance.costTrend')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
