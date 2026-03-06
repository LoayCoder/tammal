import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';

export interface TimeEntry {
  id: string;
  task_id: string;
  employee_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  description: string | null;
  is_running: boolean;
  created_at: string;
}

export function useTaskTimeTracking(taskId: string | undefined) {
  const { tenantId } = useTenantId();
  const { employee } = useCurrentEmployee();
  const qc = useQueryClient();

  const { data: entries = [], isPending } = useQuery({
    queryKey: ['time-entries', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_time_entries')
        .select('*')
        .eq('task_id', taskId!)
        .is('deleted_at', null)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TimeEntry[];
    },
    enabled: !!taskId && !!tenantId,
  });

  const activeEntry = entries.find(e => e.is_running && e.employee_id === employee?.id);

  const totalMinutes = entries.reduce((sum, e) => {
    if (e.duration_minutes) return sum + e.duration_minutes;
    if (e.is_running) {
      return sum + Math.floor((Date.now() - new Date(e.started_at).getTime()) / 60000);
    }
    return sum;
  }, 0);

  const startTimer = useMutation({
    mutationFn: async () => {
      // Stop any running timer first
      if (activeEntry) {
        const dur = Math.max(1, Math.floor((Date.now() - new Date(activeEntry.started_at).getTime()) / 60000));
        await supabase.from('task_time_entries').update({
          is_running: false, ended_at: new Date().toISOString(), duration_minutes: dur, updated_at: new Date().toISOString(),
        }).eq('id', activeEntry.id);
      }
      const { error } = await supabase.from('task_time_entries').insert({
        tenant_id: tenantId!, task_id: taskId!, employee_id: employee!.id, is_running: true,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries', taskId] }),
  });

  const stopTimer = useMutation({
    mutationFn: async () => {
      if (!activeEntry) return;
      const dur = Math.max(1, Math.floor((Date.now() - new Date(activeEntry.started_at).getTime()) / 60000));
      const { error } = await supabase.from('task_time_entries').update({
        is_running: false, ended_at: new Date().toISOString(), duration_minutes: dur, updated_at: new Date().toISOString(),
      }).eq('id', activeEntry.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries', taskId] }),
  });

  const addManualEntry = useMutation({
    mutationFn: async ({ minutes, description }: { minutes: number; description?: string }) => {
      const started = new Date();
      const ended = new Date(started.getTime() + minutes * 60000);
      const { error } = await supabase.from('task_time_entries').insert({
        tenant_id: tenantId!, task_id: taskId!, employee_id: employee!.id,
        started_at: started.toISOString(), ended_at: ended.toISOString(),
        duration_minutes: minutes, description: description || null, is_running: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries', taskId] }),
  });

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_time_entries')
        .update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries', taskId] }),
  });

  return {
    entries, isPending, activeEntry, totalMinutes,
    startTimer: startTimer.mutate, stopTimer: stopTimer.mutate,
    addManualEntry: addManualEntry.mutate, removeEntry: removeEntry.mutate,
    isStarting: startTimer.isPending, isStopping: stopTimer.isPending,
  };
}
