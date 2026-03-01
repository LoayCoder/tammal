import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { GovernanceSummaryRow } from '@/hooks/ai-governance/useGovernanceSummary';

interface Props {
  summary: GovernanceSummaryRow[];
  isLoading: boolean;
}

export function ExplorationMonitor({ summary, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <Card><CardContent className="pt-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>;
  }

  // Aggregate usage by provider
  const byProvider: Record<string, number> = {};
  summary.forEach(r => {
    if (r.provider) {
      byProvider[r.provider] = (byProvider[r.provider] ?? 0) + (r.calls_last_24h ?? 0);
    }
  });

  const total = Object.values(byProvider).reduce((s, v) => s + v, 0);
  const chartData = Object.entries(byProvider).map(([provider, calls]) => ({
    provider,
    calls,
    percentage: total > 0 ? Number(((calls / total) * 100).toFixed(1)) : 0,
  }));

  const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <Card>
      <CardHeader><CardTitle>{t('aiGovernance.explorationMonitor')}</CardTitle></CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="provider" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
              <Legend />
              <Bar dataKey="calls" name={t('aiGovernance.calls24h')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
