import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

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
      const { error } = await supabase
        .from('redistribution_recommendations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['redistribution-recommendations'] });
    },
  });

  const pending = (query.data ?? []).filter(r => r.status === 'pending');

  return {
    recommendations: query.data ?? [],
    pending,
    isPending: query.isPending,
    updateStatus,
  };
}
