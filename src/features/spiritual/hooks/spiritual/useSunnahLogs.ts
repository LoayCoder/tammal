import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const SUNNAH_PRACTICES = [
  { key: 'fasting', emoji: '🍽️', labelEn: 'Fasting', labelAr: 'الصيام' },
  { key: 'adhkar_morning', emoji: '🌅', labelEn: 'Morning Adhkar', labelAr: 'أذكار الصباح' },
  { key: 'adhkar_evening', emoji: '🌙', labelEn: 'Evening Adhkar', labelAr: 'أذكار المساء' },
  { key: 'tahajjud', emoji: '🕌', labelEn: 'Tahajjud', labelAr: 'التهجد' },
  { key: 'duha', emoji: '☀️', labelEn: 'Duha Prayer', labelAr: 'صلاة الضحى' },
] as const;

export type PracticeKey = typeof SUNNAH_PRACTICES[number]['key'];

export interface SunnahLog {
  id: string;
  user_id: string;
  log_date: string;
  practice_type: string;
  completed: boolean;
  created_at: string;
}

export function useSunnahLogs() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const { data: logs = [], isPending } = useQuery({
    queryKey: ['sunnah-logs', user?.id, thirtyDaysAgo, today],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('spiritual_sunnah_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', thirtyDaysAgo)
        .lte('log_date', today)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SunnahLog[];
    },
    enabled: !!user?.id,
  });

  const togglePractice = useMutation({
    mutationFn: async ({ practice_type, completed }: { practice_type: string; completed: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (completed) {
        // Upsert as completed
        const { error } = await supabase
          .from('spiritual_sunnah_logs')
          .upsert(
            { user_id: user.id, log_date: today, practice_type, completed: true },
            { onConflict: 'user_id,log_date,practice_type' }
          );
        if (error) throw error;
      } else {
        // Delete the log entry to undo
        const { error } = await supabase
          .from('spiritual_sunnah_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('log_date', today)
          .eq('practice_type', practice_type);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sunnah-logs'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Today's completed practices
  const todayLogs = logs.filter(l => l.log_date === today && l.completed);
  const todayCompleted = new Set(todayLogs.map(l => l.practice_type));

  // 30-day stats per practice
  const stats = SUNNAH_PRACTICES.map(p => ({
    key: p.key,
    count: logs.filter(l => l.practice_type === p.key && l.completed).length,
  }));

  const totalCompleted = logs.filter(l => l.completed).length;

  return { logs, isPending, togglePractice, todayCompleted, stats, totalCompleted };
}

