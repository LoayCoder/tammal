import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { GovernanceSummaryRow } from '@/hooks/ai-governance/useGovernanceSummary';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  summary: GovernanceSummaryRow[];
  isLoading: boolean;
}

function betaPdf(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return 0;
  // Use log-space to avoid overflow
  const logB = logBeta(alpha, beta);
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logB);
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

function logGamma(z: number): number {
  // Lanczos approximation
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function ThompsonVisualizer({ summary, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <Card><CardContent className="pt-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>;
  }

  // Unique providers with TS data
  const providers = summary
    .filter(r => r.provider && r.ts_alpha != null && r.ts_beta != null)
    .reduce<Record<string, { alpha: number; beta: number; sampleCount: number }>>((acc, r) => {
      if (!acc[r.provider!]) {
        acc[r.provider!] = { alpha: r.ts_alpha!, beta: r.ts_beta!, sampleCount: r.sample_count ?? 0 };
      }
      return acc;
    }, {});

  const providerNames = Object.keys(providers);
  if (providerNames.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('aiGovernance.thompsonVisualizer')}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">{t('common.noData')}</p></CardContent>
      </Card>
    );
  }

  // Generate PDF curve data
  const points = 100;
  const chartData = Array.from({ length: points + 1 }, (_, i) => {
    const x = i / points;
    const row: Record<string, number> = { x: Number(x.toFixed(3)) };
    for (const name of providerNames) {
      const { alpha, beta } = providers[name];
      row[name] = Number(betaPdf(x, alpha, beta).toFixed(4));
    }
    return row;
  });

  const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{t('aiGovernance.thompsonVisualizer')}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="x" label={{ value: 'Quality (p)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
              {providerNames.map((name, idx) => (
                <Area key={name} type="monotone" dataKey={name} stroke={colors[idx % colors.length]} fill={colors[idx % colors.length]} fillOpacity={0.1} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {providerNames.map((name, idx) => {
          const { alpha, beta, sampleCount } = providers[name];
          const mean = alpha / (alpha + beta);
          return (
            <Card key={name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                  {name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>α = {alpha.toFixed(1)}, β = {beta.toFixed(1)}</p>
                <p>{t('aiGovernance.meanQuality')}: {(mean * 100).toFixed(1)}%</p>
                <p>{t('aiGovernance.samples')}: {sampleCount}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
