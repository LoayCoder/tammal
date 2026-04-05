import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface RedistributionRecommendation {
  id: string;
  from_employee_id: string;
  to_employee_id: string;
  action_id: string | null;
  reason: string | null;
  priority: string;
  capacity_diff: number;
  skill_match_score: number;
  status: string;
  ai_reasoning: string | null;
  created_at: string;
}

export function useRedistributionRecommendations() {
  const { tenantId } = useTenantId();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['redistribution-recommendations', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redistribution_recommendations')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as RedistributionRecommendation[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      // Update recommendation status
      const { error } = await supabase
        .from('redistribution_recommendations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      // If accepted, actually reassign the task
      if (status === 'accepted') {
        const rec = (query.data ?? []).find(r => r.id === id);
        if (rec?.action_id) {
          // Reassign in objective_actions (strategic tasks)
          const { error: reassignErr } = await supabase
            .from('objective_actions')
            .update({ assignee_id: rec.to_employee_id })
            .eq('id', rec.action_id);
          if (reassignErr) throw reassignErr;
        }
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['redistribution-recommendations'] });
      qc.invalidateQueries({ queryKey: ['unified-tasks'] });
      qc.invalidateQueries({ queryKey: ['department-tasks'] });
      toast.success(
        variables.status === 'accepted'
          ? t('executive.redistributionAccepted')
          : t('executive.redistributionRejected')
      );
    },
    onError: () => toast.error(t('common.error')),
  });

  const pending = (query.data ?? []).filter(r => r.status === 'pending');

  return {
    recommendations: query.data ?? [],
    pending,
    isPending: query.isPending,
    updateStatus,
  };
}
