import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface TaskEvidence {
  id: string;
  tenant_id: string;
  action_id: string;
  file_url: string;
  file_type: string;
  uploaded_by: string | null;
  status: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export function useTaskEvidence(actionId?: string) {
  const { tenantId } = useTenantId();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const evidenceQuery = useQuery({
    queryKey: ['task-evidence', tenantId, actionId],
    queryFn: async () => {
      let query = supabase
        .from('task_evidence')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (actionId) query = query.eq('action_id', actionId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TaskEvidence[];
    },
    enabled: !!tenantId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (params: { action_id: string; file_url: string; file_type: string; uploaded_by?: string }) => {
      const { data, error } = await supabase
        .from('task_evidence')
        .insert({ tenant_id: tenantId!, ...params })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-evidence'] });
      toast.success(t('workload.evidence.uploadSuccess', 'Evidence uploaded'));
    },
    onError: () => toast.error(t('workload.evidence.uploadError', 'Failed to upload evidence')),
  });

  const verifyMutation = useMutation({
    mutationFn: async (params: { id: string; status: 'approved' | 'rejected'; verified_by: string }) => {
      const { data, error } = await supabase
        .from('task_evidence')
        .update({ status: params.status, verified_by: params.verified_by, verified_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-evidence'] });
      toast.success(t('workload.evidence.verifySuccess', 'Evidence verified'));
    },
    onError: () => toast.error(t('workload.evidence.verifyError', 'Failed to verify evidence')),
  });

  return {
    evidence: evidenceQuery.data ?? [],
    isPending: evidenceQuery.isPending,
    uploadEvidence: uploadMutation.mutate,
    verifyEvidence: verifyMutation.mutate,
    isUploading: uploadMutation.isPending,
    isVerifying: verifyMutation.isPending,
  };
}
