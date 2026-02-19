import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface MoodDefinition {
  id: string;
  tenant_id: string;
  key: string;
  emoji: string;
  label_en: string;
  label_ar: string;
  color: string;
  score: number;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
}

export function useMoodDefinitions(tenantId: string | null) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: moods = [], isLoading } = useQuery({
    queryKey: ['mood-definitions', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('mood_definitions' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('sort_order');
      if (error) throw error;
      return (data as unknown as MoodDefinition[]) || [];
    },
    enabled: !!tenantId,
  });

  const upsertMood = useMutation({
    mutationFn: async (mood: Partial<MoodDefinition> & { tenant_id: string; key: string }) => {
      const { error } = await supabase
        .from('mood_definitions' as any)
        .upsert(mood as any, { onConflict: 'tenant_id,key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-definitions', tenantId] });
      toast.success(t('moodPathway.moodSaved'));
    },
    onError: () => {
      toast.error(t('moodPathway.moodSaveFailed'));
    },
  });

  const deleteMood = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('mood_definitions' as any)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-definitions', tenantId] });
      toast.success(t('moodPathway.moodDeleted'));
    },
    onError: () => {
      toast.error(t('moodPathway.moodDeleteFailed'));
    },
  });

  const toggleMood = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('mood_definitions' as any)
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-definitions', tenantId] });
    },
  });

  const reorderMoods = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('mood_definitions' as any).update({ sort_order: index } as any).eq('id', id)
      );
      const results = await Promise.all(updates);
      const err = results.find(r => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-definitions', tenantId] });
    },
  });

  return {
    moods,
    activeMoods: moods.filter(m => m.is_active),
    isLoading,
    upsertMood,
    deleteMood,
    toggleMood,
    reorderMoods,
  };
}
