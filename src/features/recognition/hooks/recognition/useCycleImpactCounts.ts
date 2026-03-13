import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CycleImpactCounts {
  themes: number;
  nominations: number;
  votes: number;
}

export function useCycleImpactCounts(cycleId: string | null) {
  return useQuery({
    queryKey: ['cycle-impact-counts', cycleId],
    queryFn: async (): Promise<CycleImpactCounts> => {
      if (!cycleId) return { themes: 0, nominations: 0, votes: 0 };

      const [themesRes, nominationsRes, votesRes] = await Promise.all([
        supabase
          .from('award_themes')
          .select('id', { count: 'exact', head: true })
          .eq('cycle_id', cycleId)
          .is('deleted_at', null),
        supabase
          .from('nominations')
          .select('id', { count: 'exact', head: true })
          .eq('cycle_id', cycleId)
          .is('deleted_at', null),
        supabase
          .from('votes')
          .select('id', { count: 'exact', head: true })
          .eq('cycle_id', cycleId)
          .is('deleted_at', null),
      ]);

      return {
        themes: themesRes.count ?? 0,
        nominations: nominationsRes.count ?? 0,
        votes: votesRes.count ?? 0,
      };
    },
    enabled: !!cycleId,
    staleTime: 30_000,
  });
}
