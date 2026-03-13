import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RiskBadge } from './RiskBadge';
import type { GovernanceSummaryRow } from '@/features/ai-governance/hooks/useGovernanceSummary';
import type { CostDailyRow } from '@/features/ai-governance/hooks/useCostBreakdown';

interface Props {
  summary: GovernanceSummaryRow[];
  costData: CostDailyRow[];
  budgetConfig: Record<string, unknown> | null;
  isLoading: boolean;
}

function safeNum(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatSafe(v: number, decimals: number): string {
  return Number.isFinite(v) ? v.toFixed(decimals) : '—';
}

export function GovernanceOverview({ summary, costData, budgetConfig, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }),
    [locale]
  );

  // Aggregated KPIs
  const { projectedCost, burnRate, slaRisk, driftScore, totalCalls, dominantProviderName, dominancePct } = useMemo(() => {
    if (!summary?.length) {
      return { projectedCost: 0, burnRate: 0, slaRisk: 'low', driftScore: 0, totalCalls: 0, dominantProviderName: null, dominancePct: '0' };
    }

    const projectedCost = summary.reduce((s, r) => s + safeNum(r.projected_monthly_cost), 0);
    const burnRate = summary.reduce((s, r) => s + safeNum(r.burn_rate), 0);
    const driftScore = summary.reduce((s, r) => s + safeNum(r.performance_drift_score), 0) / summary.length;
    const totalCalls = summary.reduce((s, r) => s + safeNum(r.calls_last_24h), 0);

    // Worst SLA risk
    const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
    const slaRisk = summary.reduce((worst, r) => {
      const level = r.sla_risk_level ?? 'low';
      return (riskOrder[level] ?? 0) > (riskOrder[worst] ?? 0) ? level : worst;
    }, 'low');

    // Dominant provider — group by provider
    const providerUsage = new Map<string, number>();
    summary.forEach(r => {
      if (r.provider) {
        providerUsage.set(r.provider, (providerUsage.get(r.provider) ?? 0) + safeNum(r.usage_percentage));
      }
    });
    let dominantProviderName: string | null = null;
    let maxUsage = 0;
    let totalUsage = 0;
    providerUsage.forEach((usage, provider) => {
      totalUsage += usage;
      if (usage > maxUsage) { maxUsage = usage; dominantProviderName = provider; }
    });
    const dominancePct = totalUsage > 0 ? ((maxUsage / totalUsage) * 100).toFixed(0) : '0';

    return { projectedCost, burnRate, slaRisk, driftScore, totalCalls, dominantProviderName, dominancePct };
  }, [summary]);

  const strategy = (budgetConfig?.routing_strategy as string) ?? 'cost_aware';
  const budget = safeNum(budgetConfig?.monthly_budget as number);
  const budgetUtilization = budget > 0 ? ((projectedCost / budget) * 100) : null;
  const budgetUtilizationStr = budgetUtilization != null ? formatSafe(budgetUtilization, 1) : 'N/A';

  // Memoized chart data
  const chartData = useMemo(() => {
    const costByDate = costData.reduce<Record<string, number>>((acc, r) => {
      acc[r.date] = (acc[r.date] ?? 0) + r.total_cost;
      return acc;
    }, {});
    return Object.entries(costByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost: Number(cost.toFixed(4)) }));
  }, [costData]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-24" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!summary?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.strategy')}</CardTitle></CardHeader>
          <CardContent><Badge variant="secondary" className="text-base">{strategy}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.projectedCost')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{currencyFormatter.format(projectedCost)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.budgetRisk')}</CardTitle></CardHeader>
          <CardContent>
            <RiskBadge level={budgetUtilization != null && budgetUtilization > 90 ? 'high' : budgetUtilization != null && budgetUtilization > 70 ? 'medium' : 'low'} />
            <p className="text-sm text-muted-foreground mt-1">{budgetUtilizationStr}% {t('aiGovernance.utilized')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.slaRisk')}</CardTitle></CardHeader>
          <CardContent><RiskBadge level={slaRisk} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.burnRate')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{currencyFormatter.format(burnRate)}<span className="text-sm text-muted-foreground">/{t('aiGovernance.perDay')}</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.dominantProvider')}</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{dominantProviderName ?? 'N/A'} <span className="text-muted-foreground">({dominancePct}%)</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.performanceDrift')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatSafe(driftScore * 100, 1)}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('aiGovernance.totalCalls24h')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalCalls.toLocaleString(locale)}</p></CardContent>
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
