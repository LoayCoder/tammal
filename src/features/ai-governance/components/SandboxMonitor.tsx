import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSandboxEvaluations, type SandboxEvaluation } from '@/features/ai-governance/hooks/useSandboxEvaluations';
import { useUserPermissions } from '@/hooks/auth/useUserPermissions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'active' ? 'default'
    : status === 'promoted' ? 'default'
    : status === 'disabled' ? 'destructive'
    : 'secondary';
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}

export function SandboxMonitor() {
  const { t } = useTranslation();
  const { data: evaluations = [], isPending } = useSandboxEvaluations();
  const { isSuperAdmin } = useUserPermissions();
  const qc = useQueryClient();

  const manageSandbox = useMutation({
    mutationFn: async ({ action, sandboxId }: { action: string; sandboxId: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action, params: { sandbox_id: sandboxId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-governance'] });
      toast.success(t('aiGovernance.autonomous.sandboxUpdated'));
    },
  });

  if (isPending) return <Card><CardContent className="p-6 text-muted-foreground">{t('common.loading')}</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          {t('aiGovernance.autonomous.sandboxTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evaluations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('aiGovernance.autonomous.noSandbox')}</p>
        ) : (
          <div className="space-y-4">
            {evaluations.map((ev: SandboxEvaluation) => {
              const callProgress = Math.min((ev.calls_total / 100) * 100, 100);
              const daysElapsed = Math.floor((Date.now() - new Date(ev.started_at).getTime()) / 86400000);
              const timeProgress = Math.min((daysElapsed / 7) * 100, 100);
              const successRate = ev.calls_total > 0 ? ((ev.calls_success / ev.calls_total) * 100).toFixed(1) : '–';

              return (
                <div key={ev.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ev.provider}/{ev.model}</span>
                      <StatusBadge status={ev.status} />
                      <span className="text-xs text-muted-foreground">{ev.traffic_percentage}% {t('aiGovernance.autonomous.traffic')}</span>
                    </div>
                    {isSuperAdmin && ev.status === 'active' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => manageSandbox.mutate({ action: 'promote_sandbox', sandboxId: ev.id })}>
                          <CheckCircle2 className="h-3 w-3 me-1" />
                          {t('aiGovernance.autonomous.promote')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => manageSandbox.mutate({ action: 'disable_sandbox', sandboxId: ev.id })}>
                          <XCircle className="h-3 w-3 me-1" />
                          {t('aiGovernance.autonomous.disable')}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('aiGovernance.autonomous.calls')}</span>
                      <p className="font-medium">{ev.calls_total}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('aiGovernance.autonomous.successRate')}</span>
                      <p className="font-medium">{successRate}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('aiGovernance.autonomous.avgLatency')}</span>
                      <p className="font-medium">{ev.avg_latency?.toFixed(0) || '–'} ms</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('aiGovernance.autonomous.quality')}</span>
                      <p className="font-medium">{ev.median_quality?.toFixed(1) || '–'}</p>
                    </div>
                  </div>

                  {ev.status === 'active' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('aiGovernance.autonomous.callProgress')}</span>
                        <span>{ev.calls_total}/100</span>
                      </div>
                      <Progress value={callProgress} className="h-1.5" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('aiGovernance.autonomous.timeProgress')}</span>
                        <span>{daysElapsed}/7 {t('aiGovernance.autonomous.days')}</span>
                      </div>
                      <Progress value={timeProgress} className="h-1.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
