import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Site {
  id: string;
  tenant_id: string;
  branch_id: string;
  department_id: string | null;
  head_employee_id: string | null;
  name: string;
  name_ar: string | null;
  address: string | null;
  address_ar: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SiteInput {
  tenant_id: string;
  branch_id: string;
  department_id?: string | null;
  head_employee_id?: string | null;
  name: string;
  name_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  color?: string;
}

export function useSites() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Site[];
    },
  });

  const createSite = useMutation({
    mutationFn: async (input: SiteInput) => {
      const { data, error } = await supabase
        .from('sites')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success(t('sections.createSuccess'));
    },
    onError: () => toast.error(t('sections.createError')),
  });

  const updateSite = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Site> & { id: string }) => {
      const { data, error } = await supabase
        .from('sites')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success(t('sections.updateSuccess'));
    },
    onError: () => toast.error(t('sections.updateError')),
  });

  const deleteSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sites')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success(t('sections.deleteSuccess'));
    },
    onError: () => toast.error(t('sections.deleteError')),
  });

  return { sites, isLoading, createSite, updateSite, deleteSite };
}
