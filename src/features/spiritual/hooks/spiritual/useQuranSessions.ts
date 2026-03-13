import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
import { toast } from 'sonner';

export interface QuranSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  surah_name: string | null;
  juz_number: number | null;
  reflection_notes: string | null;
  ayahs_read: number | null;
  last_ayah_position: number | null;
  session_date: string;
  created_at: string;
}

export function useQuranSessions(dateRange?: { from: string; to: string }, surahFilter?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const from = dateRange?.from ?? today;
  const to = dateRange?.to ?? today;

  const { data: sessions = [], isPending, isFetching } = useQuery({
    queryKey: ['quran-sessions', user?.id, from, to, surahFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('spiritual_quran_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('session_date', from)
        .lte('session_date', to)
        .order('session_date', { ascending: false });
      if (surahFilter) {
        query = query.eq('surah_name', surahFilter);
      }
      const { data, error } = await query;
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
      ayahs_read?: number;
      last_ayah_position?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('spiritual_quran_sessions')
        .insert({
          user_id: user.id,
          duration_minutes: input.duration_minutes,
          surah_name: input.surah_name || null,
          juz_number: input.juz_number || null,
          reflection_notes: input.reflection_notes || null,
          session_date: input.session_date ?? today,
          ayahs_read: input.ayahs_read ?? 0,
          last_ayah_position: input.last_ayah_position ?? 0,
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

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalSessions = sessions.length;

  return { sessions, isPending: isPending && isFetching, logSession, totalMinutes, totalSessions };
}

export function useLastQuranSession() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quran-sessions', 'last', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('spiritual_quran_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as QuranSession | null;
    },
    enabled: !!user?.id,
  });
}

