import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import type { CostDailyRow } from '@/hooks/ai-governance/useCostBreakdown';

interface Props {
  costData: CostDailyRow[];
  budgetConfig: Record<string, unknown> | null;
  isLoading: boolean;
}

export function FinanceDashboard({ costData, budgetConfig, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>)}</div>;
  }

  const monthlyBudget = (budgetConfig?.monthly_budget as number) ?? 0;
  const totalSpend = costData.reduce((s, r) => s + r.total_cost, 0);

  // Cost by provider
  const byProvider: Record<string, number> = {};
  costData.forEach(r => {
    byProvider[r.provider] = (byProvider[r.provider] ?? 0) + r.total_cost;
  });
  const providerChart = Object.entries(byProvider).map(([provider, cost]) => ({ provider, cost: Number(cost.toFixed(4)) }));

  // Cost by feature
  const byFeature: Record<string, number> = {};
  costData.forEach(r => {
    byFeature[r.feature] = (byFeature[r.feature] ?? 0) + r.total_cost;
  });
  const featureChart = Object.entries(byFeature).map(([feature, cost]) => ({ feature, cost: Number(cost.toFixed(4)) }));

  // Cost trend by date
  const byDate: Record<string, number> = {};
  costData.forEach(r => { byDate[r.date] = (byDate[r.date] ?? 0) + r.total_cost; });
  const trendData = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, cost]) => ({ date, cost: Number(cost.toFixed(4)) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('aiGovernance.totalSpend')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${totalSpend.toFixed(4)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('aiGovernance.monthlyBudget')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${monthlyBudget.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('aiGovernance.budgetUtilization')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{monthlyBudget > 0 ? ((totalSpend / monthlyBudget) * 100).toFixed(1) : 'N/A'}%</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('aiGovernance.costTrend')}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
              <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('aiGovernance.costByProvider')}</CardTitle></CardHeader>
          <CardContent>
            {providerChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={providerChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="provider" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                  <Bar dataKey="cost" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground">{t('common.noData')}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('aiGovernance.costByFeature')}</CardTitle></CardHeader>
          <CardContent>
            {featureChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={featureChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="feature" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                  <Bar dataKey="cost" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground">{t('common.noData')}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
