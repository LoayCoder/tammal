import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Approval } from '@/features/approvals/types';

export function useApprovals(entityType?: string, entityId?: string) {
  const { tenantId } = useTenantId();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { logEvent } = useAuditLog();

  const approvalsQuery = useQuery({
    queryKey: ['approvals', tenantId, entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from('approvals')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (entityType) query = query.eq('entity_type', entityType);
      if (entityId) query = query.eq('entity_id', entityId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Approval[];
    },
    enabled: !!tenantId,
  });

  const requestApproval = useMutation({
    mutationFn: async (params: { entity_type: string; entity_id: string; requested_by: string; justification?: string }) => {
      const { data, error } = await supabase
        .from('approvals')
        .insert({ tenant_id: tenantId!, ...params })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      toast.success(t('workload.approvals.requestSuccess', 'Approval requested'));
      logEvent({ entity_type: 'initiative', entity_id: data.entity_id, action: 'create', changes: { after: data } });
    },
    onError: () => toast.error(t('workload.approvals.requestError', 'Failed to request approval')),
  });

  const decideApproval = useMutation({
    mutationFn: async (params: { id: string; status: 'approved' | 'rejected'; approved_by: string; justification?: string }) => {
      const { data, error } = await supabase
        .from('approvals')
        .update({ status: params.status, approved_by: params.approved_by, justification: params.justification })
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      toast.success(t('workload.approvals.decideSuccess', 'Decision recorded'));
      logEvent({ entity_type: 'initiative', entity_id: data.entity_id, action: 'status_change', changes: { after: data } });
    },
    onError: () => toast.error(t('workload.approvals.decideError', 'Failed to record decision')),
  });

  return {
    approvals: approvalsQuery.data ?? [],
    isPending: approvalsQuery.isPending,
    requestApproval: requestApproval.mutate,
    decideApproval: decideApproval.mutate,
  };
}
