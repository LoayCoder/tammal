import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';

export interface RiskMapping {
  id: string;
  tenant_id: string;
  intent: string;
  risk_level: 'high' | 'moderate' | 'low';
  action_description: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = 'risk-mappings';

export function useRiskMappings() {
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: [QUERY_KEY, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_risk_mappings' as any)
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RiskMapping[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateRiskMapping() {
  const qc = useQueryClient();
  const { tenantId } = useTenantId();

  return useMutation({
    mutationFn: async (input: { intent: string; risk_level: string; action_description?: string; sort_order?: number }) => {
      const { error } = await supabase
        .from('mh_risk_mappings' as any)
        .insert({ ...input, tenant_id: tenantId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Risk mapping created');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateRiskMapping() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; intent?: string; risk_level?: string; action_description?: string | null; sort_order?: number }) => {
      const { error } = await supabase
        .from('mh_risk_mappings' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Risk mapping updated');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteRiskMapping() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mh_risk_mappings' as any)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Risk mapping deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
