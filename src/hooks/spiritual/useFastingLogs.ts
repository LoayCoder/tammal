import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from 'sonner';

export interface FastingLog {
  id: string;
  user_id: string;
  fast_date: string;
  fast_type: string;
  completed: boolean;
  energy_rating: number | null;
  notes: string | null;
  created_at: string;
}

// Sunnah fasting types
export const FAST_TYPES = [
  { key: 'monday', labelEn: 'Monday', labelAr: 'الاثنين' },
  { key: 'thursday', labelEn: 'Thursday', labelAr: 'الخميس' },
  { key: 'white_days', labelEn: 'White Days (13-14-15)', labelAr: 'الأيام البيض (13-14-15)' },
  { key: 'shawwal', labelEn: '6 Days of Shawwal', labelAr: 'ست من شوال' },
  { key: 'arafah', labelEn: 'Day of Arafah', labelAr: 'يوم عرفة' },
  { key: 'ashura', labelEn: 'Day of Ashura', labelAr: 'يوم عاشوراء' },
  { key: 'voluntary', labelEn: 'Voluntary Fast', labelAr: 'صيام تطوعي' },
] as const;

export function useFastingLogs(dateRange?: { from: string; to: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  

  const today = new Date().toISOString().split('T')[0];
  const from = dateRange?.from ?? new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  const to = dateRange?.to ?? today;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['fasting-logs', user?.id, from, to],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('spiritual_fasting_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('fast_date', from)
        .lte('fast_date', to)
        .order('fast_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FastingLog[];
    },
    enabled: !!user?.id,
  });

  const logFast = useMutation({
    mutationFn: async (input: {
      fast_date: string;
      fast_type: string;
      completed: boolean;
      energy_rating?: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('spiritual_fasting_logs')
        .upsert(
          {
            user_id: user.id,
            fast_date: input.fast_date,
            fast_type: input.fast_type,
            completed: input.completed,
            energy_rating: input.energy_rating ?? null,
            notes: input.notes ?? null,
          },
          { onConflict: 'user_id,fast_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasting-logs'] });
      toast.success('Fasting logged');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const todayLog = logs.find(l => l.fast_date === today);
  const completedCount = logs.filter(l => l.completed).length;

  return { logs, isLoading, logFast, todayLog, completedCount };
}
