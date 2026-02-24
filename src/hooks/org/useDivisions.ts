import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Division {
  id: string;
  tenant_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  head_employee_id: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DivisionInput {
  tenant_id: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  head_employee_id?: string | null;
  color?: string;
}

export function useDivisions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: divisions = [], isLoading } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('divisions')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Division[];
    },
  });

  const createDivision = useMutation({
    mutationFn: async (input: DivisionInput) => {
      const { data, error } = await supabase
        .from('divisions')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      toast.success(t('divisions.createSuccess'));
    },
    onError: () => toast.error(t('divisions.createError')),
  });

  const updateDivision = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Division> & { id: string }) => {
      const { data, error } = await supabase
        .from('divisions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      toast.success(t('divisions.updateSuccess'));
    },
    onError: () => toast.error(t('divisions.updateError')),
  });

  const deleteDivision = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('divisions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      toast.success(t('divisions.deleteSuccess'));
    },
    onError: () => toast.error(t('divisions.deleteError')),
  });

  return { divisions, isLoading, createDivision, updateDivision, deleteDivision };
}
