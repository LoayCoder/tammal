import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PerformanceDailyRow } from '@/features/ai-governance/hooks/usePerformanceTrend';

interface Props {
  performanceData: PerformanceDailyRow[];
  penalties: any[];
  isLoading: boolean;
}

export function RiskDashboard({ performanceData, penalties, isLoading }: Props) {
  const { t } = useTranslation();

  const trendData = useMemo(() => {
    const byDate: Record<string, { latency: number; errorRate: number; count: number }> = {};
    performanceData.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { latency: 0, errorRate: 0, count: 0 };
      byDate[r.date].latency += r.avg_latency ?? 0;
      byDate[r.date].errorRate += r.error_rate ?? 0;
      byDate[r.date].count += 1;
    });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
      date,
      latency: Number((v.latency / v.count).toFixed(0)),
      errorRate: Number(((v.errorRate / v.count) * 100).toFixed(2)),
    }));
  }, [performanceData]);

  // Filter expired penalties client-side
  const activePenalties = useMemo(() => {
    const now = new Date();
    return penalties.filter((p: any) => new Date(p.penalty_expires_at) > now);
  }, [penalties]);

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('aiGovernance.latencyTrend')}</CardTitle></CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                  <Line type="monotone" dataKey="latency" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} name={t('aiGovernance.avgLatencyMs')} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground">{t('common.noData')}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('aiGovernance.errorRateTrend')}</CardTitle></CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                  <Line type="monotone" dataKey="errorRate" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name={t('aiGovernance.errorRatePct')} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground">{t('common.noData')}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('aiGovernance.activePenalties')}</CardTitle></CardHeader>
        <CardContent>
          {activePenalties.length === 0 ? (
            <p className="text-muted-foreground">{t('aiGovernance.noPenalties')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.provider')}</th>
                    <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.feature')}</th>
                    <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.multiplier')}</th>
                    <th className="text-start py-2 font-medium text-muted-foreground">{t('aiGovernance.expires')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activePenalties.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2 pe-4">{p.provider}</td>
                      <td className="py-2 pe-4">{p.feature}</td>
                      <td className="py-2 pe-4">{p.penalty_multiplier}x</td>
                      <td className="py-2 text-muted-foreground">{new Date(p.penalty_expires_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
