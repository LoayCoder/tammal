import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface QuranSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  surah_name: string | null;
  juz_number: number | null;
  reflection_notes: string | null;
  session_date: string;
  created_at: string;
}

export function useQuranSessions(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  

  const today = new Date().toISOString().split('T')[0];
  const from = dateRange?.from ?? today;
  const to = dateRange?.to ?? today;

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['quran-sessions', user?.id, from, to],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('spiritual_quran_sessions' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('session_date', from)
        .lte('session_date', to)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as QuranSession[];
    },
    enabled: !!user?.id,
  });

  const logSession = useMutation({
    mutationFn: async (input: {
      duration_minutes: number;
      surah_name?: string;
      juz_number?: number;
      reflection_notes?: string;
      session_date?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('spiritual_quran_sessions' as any)
        .insert({
          user_id: user.id,
          duration_minutes: input.duration_minutes,
          surah_name: input.surah_name || null,
          juz_number: input.juz_number || null,
          reflection_notes: input.reflection_notes || null,
          session_date: input.session_date ?? today,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quran-sessions'] });
      toast.success('Qur\'an session logged');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Weekly stats
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalSessions = sessions.length;

  return { sessions, isLoading, logSession, totalMinutes, totalSessions };
}
