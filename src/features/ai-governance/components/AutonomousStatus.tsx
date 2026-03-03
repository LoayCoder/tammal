import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Shield, Clock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAutonomousState, type AutonomousStateRow } from '@/hooks/ai-governance/useAutonomousState';
import { useUserPermissions } from '@/hooks/auth/useUserPermissions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmDialog } from '@/shared/dialogs/ConfirmDialog';

function ModeBadge({ mode }: { mode: string }) {
  const variant = mode === 'enabled' ? 'default' : mode === 'shadow' ? 'secondary' : 'outline';
  return <Badge variant={variant} className="capitalize">{mode}</Badge>;
}

function WeightBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(value * 100).toFixed(0)}%` }} />
      </div>
      <span className="w-12 text-end font-mono text-xs">{(value * 100).toFixed(1)}%</span>
    </div>
  );
}

export function AutonomousStatus() {
  const { t } = useTranslation();
  const { data: states = [], isPending } = useAutonomousState();
  const { isSuperAdmin } = useUserPermissions();
  const qc = useQueryClient();

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingModeChange, setPendingModeChange] = useState<{ tenantId: string; feature: string; mode: string } | null>(null);

  const toggleMode = useMutation({
    mutationFn: async ({ tenantId, feature, mode }: { tenantId: string; feature: string; mode: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'toggle_autonomous_mode', params: { tenant_id: tenantId, feature, mode } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-governance'] });
      toast.success(t('aiGovernance.autonomous.modeUpdated'));
    },
  });

  const rollback = useMutation({
    mutationFn: async ({ tenantId, feature }: { tenantId: string; feature: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'rollback_weights', params: { tenant_id: tenantId, feature } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-governance'] });
      toast.success(t('aiGovernance.autonomous.weightsRolledBack'));
    },
  });

  const handleModeChange = (tenantId: string, feature: string, mode: string) => {
    setPendingModeChange({ tenantId, feature, mode });
    setConfirmOpen(true);
  };

  const confirmModeChange = () => {
    if (pendingModeChange) {
      toggleMode.mutate(pendingModeChange);
    }
    setConfirmOpen(false);
    setPendingModeChange(null);
  };

  if (isPending) return <Card><CardContent className="p-6 text-muted-foreground">{t('common.loading')}</CardContent></Card>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('aiGovernance.autonomous.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {states.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('aiGovernance.autonomous.noStates')}</p>
          ) : (
            states.map((s: AutonomousStateRow) => (
              <div key={`${s.tenant_id}-${s.feature}`} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.feature}</span>
                    <ModeBadge mode={s.mode} />
                    {s.anomaly_frozen_until && new Date(s.anomaly_frozen_until) > new Date() && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {t('aiGovernance.autonomous.frozen')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <>
                        <Select
                          value={s.mode}
                          onValueChange={(mode) => handleModeChange(s.tenant_id, s.feature, mode)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">{t('aiGovernance.autonomous.modes.enabled')}</SelectItem>
                            <SelectItem value="disabled">{t('aiGovernance.autonomous.modes.disabled')}</SelectItem>
                            <SelectItem value="shadow">{t('aiGovernance.autonomous.modes.shadow')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rollback.mutate({ tenantId: s.tenant_id, feature: s.feature })}
                          disabled={(s.previous_weights_history || []).length === 0}
                        >
                          <RotateCcw className="h-3 w-3 me-1" />
                          {t('aiGovernance.autonomous.rollback')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <WeightBar label={t('aiGovernance.autonomous.weights.quality')} value={s.current_weights.w_quality || 0.2} />
                  <WeightBar label={t('aiGovernance.autonomous.weights.latency')} value={s.current_weights.w_latency || 0.2} />
                  <WeightBar label={t('aiGovernance.autonomous.weights.stability')} value={s.current_weights.w_stability || 0.2} />
                  <WeightBar label={t('aiGovernance.autonomous.weights.cost')} value={s.current_weights.w_cost || 0.2} />
                  <WeightBar label={t('aiGovernance.autonomous.weights.confidence')} value={s.current_weights.w_confidence || 0.2} />
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {s.last_adjustment && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('aiGovernance.autonomous.lastAdjustment')}: {new Date(s.last_adjustment).toLocaleDateString()}
                    </span>
                  )}
                  <span>{t('aiGovernance.autonomous.magnitude')}: {(s.adjustment_score || 0).toFixed(4)}</span>
                  <span>{t('aiGovernance.autonomous.historyCount')}: {(s.previous_weights_history || []).length}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('aiGovernance.autonomous.confirmModeTitle')}
        description={t('aiGovernance.autonomous.confirmModeDescription')}
        confirmLabel={t('common.confirm')}
        onConfirm={confirmModeChange}
        loading={toggleMode.isPending}
        destructive={false}
      />
    </>
  );
}
