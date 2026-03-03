import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoutingLogEntry {
  id: string;
  created_at: string;
  model_used: string | null;
  settings: Record<string, unknown> | null;
  success: boolean | null;
  duration_ms: number | null;
  tokens_used: number | null;
}

export function useRoutingLogs(limit = 100) {
  return useQuery({
    queryKey: ['ai-governance', 'routing-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_routing_logs', params: { limit } },
      });
      if (error) throw error;
      return (data?.data ?? []) as RoutingLogEntry[];
    },
    staleTime: 30_000,
  });
}
