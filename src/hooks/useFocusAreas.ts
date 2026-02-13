import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface FocusArea {
  id: string;
  label_key: string;
  label_ar: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  tenant_id: string | null;
}

export function useFocusAreas() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: focusAreas = [], isLoading } = useQuery({
    queryKey: ['focus-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_areas')
        .select('*')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as FocusArea[];
    },
  });

  const addFocusArea = useMutation({
    mutationFn: async ({ labelKey, labelAr }: { labelKey: string; labelAr?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      
      const maxOrder = focusAreas.length > 0 ? Math.max(...focusAreas.map(f => f.sort_order)) : 0;
      
      const { error } = await supabase.from('focus_areas').insert({
        label_key: labelKey,
        label_ar: labelAr || null,
        tenant_id: profile?.tenant_id || null,
        is_default: false,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-areas'] });
      toast.success(t('aiGenerator.focusAreaAdded'));
    },
    onError: () => toast.error(t('aiGenerator.focusAreaError')),
  });

  const updateFocusArea = useMutation({
    mutationFn: async ({ id, labelKey, labelAr }: { id: string; labelKey: string; labelAr?: string }) => {
      const { error } = await supabase.from('focus_areas').update({
        label_key: labelKey,
        label_ar: labelAr || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-areas'] });
      toast.success(t('aiGenerator.focusAreaUpdated'));
    },
    onError: () => toast.error(t('aiGenerator.focusAreaError')),
  });

  const deleteFocusArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('focus_areas').update({
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-areas'] });
      toast.success(t('aiGenerator.focusAreaDeleted'));
    },
    onError: () => toast.error(t('aiGenerator.focusAreaError')),
  });

  return {
    focusAreas,
    isLoading,
    addFocusArea: addFocusArea.mutate,
    updateFocusArea: updateFocusArea.mutate,
    deleteFocusArea: deleteFocusArea.mutate,
    isAdding: addFocusArea.isPending,
  };
}
