import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface WorkSite {
  id: string;
  tenant_id: string;
  name: string;
  name_ar: string | null;
  address: string | null;
  address_ar: string | null;
  department_id: string | null;
  section_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkSiteInput {
  tenant_id: string;
  name: string;
  name_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  department_id?: string | null;
  section_id?: string | null;
}

export function useWorkSites() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: workSites = [], isPending } = useQuery({
    queryKey: ['work_sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_sites')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as WorkSite[];
    },
  });

  const createWorkSite = useMutation({
    mutationFn: async (input: WorkSiteInput) => {
      const { data, error } = await supabase
        .from('work_sites')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_sites'] });
      toast.success(t('workSites.createSuccess'));
    },
    onError: () => toast.error(t('workSites.createError')),
  });

  const updateWorkSite = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkSite> & { id: string }) => {
      const { data, error } = await supabase
        .from('work_sites')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_sites'] });
      toast.success(t('workSites.updateSuccess'));
    },
    onError: () => toast.error(t('workSites.updateError')),
  });

  const deleteWorkSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_sites')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_sites'] });
      toast.success(t('workSites.deleteSuccess'));
    },
    onError: () => toast.error(t('workSites.deleteError')),
  });

  return { workSites, isPending, createWorkSite, updateWorkSite, deleteWorkSite };
}
