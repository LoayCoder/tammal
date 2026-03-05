import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface OrgIntelligenceScore {
  id: string;
  score: number;
  components: {
    alignment: number;
    velocity: number;
    capacity_balance: number;
    burnout_health: number;
  };
  snapshot_date: string;
}

export function useOrgIntelligenceScore() {
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['org-intelligence-score', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_intelligence_scores')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as OrgIntelligenceScore | null;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });

  return {
    score: query.data,
    isPending: query.isPending,
  };
}
