import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export interface SunnahHistoryLog {
  id: string;
  user_id: string;
  log_date: string;
  practice_type: string;
  completed: boolean;
}

/**
 * Date-range-aware query for spiritual_sunnah_logs filtered to rawatib_* practice types.
 */
export function useSunnahHistoryLogs(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const from = dateRange?.from ?? today;
  const to = dateRange?.to ?? today;

  const { data: logs = [], isPending } = useQuery({
    queryKey: ['sunnah-history-logs', user?.id, from, to],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('spiritual_sunnah_logs')
        .select('id, user_id, log_date, practice_type, completed')
        .eq('user_id', user.id)
        .gte('log_date', from)
        .lte('log_date', to)
        .like('practice_type', 'rawatib_%')
        .eq('completed', true)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SunnahHistoryLog[];
    },
    enabled: !!user?.id,
  });

  return { logs, isPending };
}
