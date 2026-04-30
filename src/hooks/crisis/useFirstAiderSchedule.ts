import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TableInsert, TableUpdate } from '@/lib/supabase-types';
import type { FirstAiderSchedule } from './types';

export function useFirstAiderSchedule(firstAiderId?: string) {
  const queryClient = useQueryClient();
  const { data: schedule, isPending } = useQuery({
    queryKey: ['mh-schedule', firstAiderId],
    queryFn: async () => {
      const { data, error } = await supabase.from('mh_first_aider_schedule').select('*').eq('first_aider_id', firstAiderId!).maybeSingle();
      if (error) throw error;
      return data as FirstAiderSchedule | null;
    },
    enabled: !!firstAiderId,
  });

  const upsertSchedule = useMutation({
    mutationFn: async (data: Partial<FirstAiderSchedule> & { first_aider_id: string; tenant_id: string }) => {
      const { data: existing } = await supabase.from('mh_first_aider_schedule').select('id').eq('first_aider_id', data.first_aider_id).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('mh_first_aider_schedule').update(data as TableUpdate<'mh_first_aider_schedule'>).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mh_first_aider_schedule').insert(data as TableInsert<'mh_first_aider_schedule'>);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['mh-first-aider-schedules'] });
    },
  });

  return { schedule, isPending, upsertSchedule };
}