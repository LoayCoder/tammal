import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import type { RoutingLogEntry } from '@/hooks/ai-governance/useRoutingLogs';

interface Props {
  logs: RoutingLogEntry[];
  isLoading: boolean;
}

export function RoutingBreakdownTable({ logs, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <Card><CardContent className="pt-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('aiGovernance.routingBreakdown')}</CardTitle></CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('common.status')}</th>
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.model')}</th>
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.strategy')}</th>
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.compositeScore')}</th>
                  <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('aiGovernance.duration')}</th>
                  <th className="text-start py-2 font-medium text-muted-foreground">{t('aiGovernance.time')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 100).map((log) => {
                  const settings = log.settings ?? {};
                  return (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 pe-4">
                        <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                          {log.success ? '✓' : '✗'}
                        </Badge>
                      </td>
                      <td className="py-2 pe-4 font-mono text-xs">{log.model_used ?? 'N/A'}</td>
                      <td className="py-2 pe-4 text-xs">{(settings as any).ai_routing_strategy ?? '-'}</td>
                      <td className="py-2 pe-4 text-xs font-mono">
                        {(settings as any).ai_composite_sample_score != null
                          ? Number((settings as any).ai_composite_sample_score).toFixed(4)
                          : '-'}
                      </td>
                      <td className="py-2 pe-4 text-xs">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
