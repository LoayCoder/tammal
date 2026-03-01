import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { RoutingLogEntry } from '@/hooks/ai-governance/useRoutingLogs';

interface Props {
  logs: RoutingLogEntry[];
}

export function RoutingInspector({ logs }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RoutingLogEntry | null>(null);

  const filtered = search
    ? logs.filter(l => l.id.includes(search) || l.model_used?.includes(search))
    : logs.slice(0, 20);

  const settings = (selected?.settings ?? {}) as Record<string, unknown>;

  const fields = [
    'ai_routing_strategy', 'ai_composite_sample_score', 'ai_quality_sample',
    'ai_cost_sample', 'ai_latency_sample', 'ai_ts_alpha', 'ai_ts_beta',
    'ai_posterior_updated', 'ai_fallback_triggered',
    'ai_forecast_risk_level', 'ai_forecast_cost_weight_multiplier',
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{t('aiGovernance.routingInspector')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder={t('aiGovernance.searchById')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.model')}</th>
                  <th className="text-start py-2 font-medium text-muted-foreground">{t('aiGovernance.time')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr
                    key={log.id}
                    className={`border-b border-border/50 cursor-pointer hover:bg-muted/50 ${selected?.id === log.id ? 'bg-muted' : ''}`}
                    onClick={() => setSelected(log)}
                  >
                    <td className="py-2 pe-4 font-mono text-xs">{log.id.slice(0, 8)}…</td>
                    <td className="py-2 pe-4 text-xs">{log.model_used ?? 'N/A'}</td>
                    <td className="py-2 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader><CardTitle>{t('aiGovernance.requestDetail')}: {selected.id.slice(0, 8)}…</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {fields.map(field => (
                <div key={field} className="flex justify-between border-b border-border/30 py-1 text-sm">
                  <span className="text-muted-foreground">{field}</span>
                  <span className="font-mono">{settings[field] != null ? String(settings[field]) : '—'}</span>
                </div>
              ))}
              <div className="flex justify-between border-b border-border/30 py-1 text-sm">
                <span className="text-muted-foreground">success</span>
                <span className="font-mono">{String(selected.success)}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 py-1 text-sm">
                <span className="text-muted-foreground">duration_ms</span>
                <span className="font-mono">{selected.duration_ms ?? '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
