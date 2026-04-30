import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import type { TableInsert, TableUpdate } from '@/lib/supabase-types';
import { computeFirstAiderStatus } from './helpers';
import type { FirstAider, FirstAiderSchedule } from './types';

export function useFirstAiders(tenantId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);

  const { data: firstAiders = [], isPending } = useQuery({
    queryKey: ['mh-first-aiders', tenantId],
    queryFn: async () => {
      let query = supabase.from('mh_first_aiders').select('*').is('deleted_at', null).order('display_name');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FirstAider[];
    },
    enabled: !!user?.id,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['mh-first-aider-schedules', tenantId],
    queryFn: async () => {
      let query = supabase.from('mh_first_aider_schedule').select('*');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FirstAiderSchedule[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase.channel(`fa-schedule-${tenantId}`).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'mh_first_aider_schedule', filter: `tenant_id=eq.${tenantId}` },
      () => queryClient.invalidateQueries({ queryKey: ['mh-first-aider-schedules', tenantId] }),
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const firstAidersWithStatus = useMemo(
    () => firstAiders.map(fa => ({ ...fa, schedule: schedules.find(s => s.first_aider_id === fa.id) || null, ...computeFirstAiderStatus(schedules.find(s => s.first_aider_id === fa.id) || null) })),
    [firstAiders, schedules, tick],
  );

  const createFirstAider = useMutation({
    mutationFn: async (data: Partial<FirstAider>) => {
      const { data: result, error } = await supabase.from('mh_first_aiders').insert(data as TableInsert<'mh_first_aiders'>).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });
  const updateFirstAider = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FirstAider> & { id: string }) => {
      const { error } = await supabase.from('mh_first_aiders').update(data as TableUpdate<'mh_first_aiders'>).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });
  const deleteFirstAider = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mh_first_aiders').update({ deleted_at: new Date().toISOString() } as TableUpdate<'mh_first_aiders'>).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  return { firstAiders: firstAidersWithStatus, schedules, isPending, createFirstAider, updateFirstAider, deleteFirstAider };
}