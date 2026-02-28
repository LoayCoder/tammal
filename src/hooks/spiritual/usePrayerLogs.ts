import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export interface PrayerLog {
  id: string;
  user_id: string;
  prayer_name: string;
  prayer_date: string;
  status: string;
  logged_at: string;
  created_at: string;
}

export function usePrayerLogs(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const from = dateRange?.from ?? today;
  const to = dateRange?.to ?? today;

  const { data: logs = [], isPending, isFetching } = useQuery({
    queryKey: ['prayer-logs', user?.id, from, to],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('spiritual_prayer_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('prayer_date', from)
        .lte('prayer_date', to)
        .order('prayer_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PrayerLog[];
    },
    enabled: !!user?.id,
  });

  const logPrayer = useMutation({
    mutationFn: async (input: { prayer_name: string; prayer_date: string; status: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Upsert: use unique constraint
      const { data, error } = await supabase
        .from('spiritual_prayer_logs')
        .upsert(
          { user_id: user.id, ...input, logged_at: new Date().toISOString() },
          { onConflict: 'user_id,prayer_name,prayer_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-logs'] });
    },
  });

  // Helper: get today's logs as a map
  const todayLogs = logs
    .filter((l) => l.prayer_date === today)
    .reduce((acc, l) => {
      acc[l.prayer_name] = l;
      return acc;
    }, {} as Record<string, PrayerLog>);

  return { logs, isPending: isPending && isFetching, logPrayer, todayLogs };
}
