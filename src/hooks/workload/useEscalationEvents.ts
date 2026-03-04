import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface EscalationEvent {
  id: string;
  tenant_id: string;
  task_id: string;
  escalation_level: number;
  escalated_to: string | null;
  reason: string | null;
  created_at: string;
}

export function useEscalationEvents(taskId?: string) {
  const { tenantId } = useTenantId();

  const queryKey = ['escalation-events', tenantId, taskId];

  const eventsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('escalation_events')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (taskId) query = query.eq('task_id', taskId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as EscalationEvent[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    events: eventsQuery.data ?? [],
    isPending: eventsQuery.isPending,
  };
}
