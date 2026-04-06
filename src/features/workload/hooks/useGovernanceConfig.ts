import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';

export interface EscalationThreshold {
  level: number;
  daysOverdue: number;
  target: string;
}

export interface SlaThresholds {
  approaching_percent: number;
  breach_percent: number;
}

export function useGovernanceConfig<T = unknown>(configKey: string) {
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: ['governance-config', tenantId, configKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_config')
        .select('id, config_key, config_value, description')
        .eq('tenant_id', tenantId!)
        .eq('config_key', configKey)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data ? (data.config_value as T) : null;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateGovernanceConfig() {
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ configKey, configValue }: { configKey: string; configValue: unknown }) => {
      const { error } = await supabase
        .from('governance_config')
        .update({ config_value: configValue as any, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId!)
        .eq('config_key', configKey)
        .is('deleted_at', null);

      if (error) throw error;
    },
    onSuccess: (_, { configKey }) => {
      qc.invalidateQueries({ queryKey: ['governance-config', tenantId, configKey] });
      toast.success('Configuration updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useEscalationThresholds() {
  return useGovernanceConfig<EscalationThreshold[]>('escalation_thresholds');
}

export function useSlaThresholds() {
  return useGovernanceConfig<SlaThresholds>('sla_thresholds');
}
