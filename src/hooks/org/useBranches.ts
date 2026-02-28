import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  name_ar: string | null;
  address: string | null;
  address_ar: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BranchInput {
  tenant_id: string;
  name: string;
  name_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  phone?: string | null;
  email?: string | null;
}

export function useBranches() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: branches = [], isPending } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Branch[];
    },
  });

  const createBranch = useMutation({
    mutationFn: async (input: BranchInput) => {
      const { data, error } = await supabase
        .from('branches')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(t('branches.createSuccess'));
    },
    onError: () => toast.error(t('branches.createError')),
  });

  const updateBranch = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Branch> & { id: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(t('branches.updateSuccess'));
    },
    onError: () => toast.error(t('branches.updateError')),
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branches')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(t('branches.deleteSuccess'));
    },
    onError: () => toast.error(t('branches.deleteError')),
  });

  return { branches, isPending, createBranch, updateBranch, deleteBranch };
}
