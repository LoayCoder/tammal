import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface ScheduleSettings {
  id?: string;
  tenant_id: string;
  delivery_time: string;
  active_days: number[];
  questions_per_day: number;
  workdays_only: boolean;
  is_active: boolean;
}

export function useWellnessScheduleSettings(tenantId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['schedule-settings', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('question_schedule_settings' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ScheduleSettings | null;
    },
    enabled: !!tenantId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (settings: Partial<ScheduleSettings>) => {
      if (!tenantId) throw new Error('No tenant');
      const payload = { ...settings, tenant_id: tenantId, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('question_schedule_settings' as any)
        .upsert(payload, { onConflict: 'tenant_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-settings'] });
      toast({ title: t('common.success'), description: t('wellness.settingsSaved') });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
  });

  return { settings: query.data, isLoading: query.isLoading, upsert: upsertMutation };
}
