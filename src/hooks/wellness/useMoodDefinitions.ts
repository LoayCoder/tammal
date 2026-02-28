import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { TableRow, TableInsert, TableUpdate } from '@/lib/supabase-types';

export type MoodDefinition = TableRow<'mood_definitions'>;
type MoodInsert = TableInsert<'mood_definitions'>;
type MoodUpdate = TableUpdate<'mood_definitions'>;

export function useMoodDefinitions(tenantId: string | null) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: moods = [], isLoading } = useQuery({
    queryKey: ['mood-definitions', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('mood_definitions')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  const upsertMood = useMutation({
    mutationFn: async (mood: MoodInsert) => {
      const { error } = await supabase
        .from('mood_definitions')
        .upsert(mood, { onConflict: 'tenant_id,key' });
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
      const update: MoodUpdate = { deleted_at: new Date().toISOString() };
      const { error } = await supabase
        .from('mood_definitions')
        .update(update)
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
      const update: MoodUpdate = { is_active };
      const { error } = await supabase
        .from('mood_definitions')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-definitions', tenantId] });
    },
  });

  const reorderMoods = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => {
        const update: MoodUpdate = { sort_order: index };
        return supabase.from('mood_definitions').update(update).eq('id', id);
      });
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
