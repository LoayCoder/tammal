import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ReferenceFramework {
  id: string;
  tenant_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  icon: string;
  framework_key: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  deleted_at: string | null;
}

export function useReferenceFrameworks() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: frameworks = [], isLoading } = useQuery({
    queryKey: ['reference-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reference_frameworks')
        .select('*')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ReferenceFramework[];
    },
  });

  const addFramework = useMutation({
    mutationFn: async (params: { name: string; name_ar?: string; description?: string; description_ar?: string; icon?: string; framework_key: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const tenantId = await supabase.rpc('get_user_tenant_id', { _user_id: user.user.id }).then(r => r.data);

      const { data, error } = await supabase.from('reference_frameworks').insert({
        ...params,
        tenant_id: tenantId,
        created_by: user.user.id,
        is_default: false,
      }).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-frameworks'] });
      toast.success(t('aiGenerator.frameworkAdded'));
    },
    onError: () => toast.error(t('aiGenerator.frameworkError')),
  });

  const updateFramework = useMutation({
    mutationFn: async (params: { id: string; name: string; name_ar?: string; description?: string; description_ar?: string; icon?: string }) => {
      const { id, ...updates } = params;
      const { error } = await supabase.from('reference_frameworks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-frameworks'] });
      toast.success(t('aiGenerator.frameworkUpdated'));
    },
    onError: () => toast.error(t('aiGenerator.frameworkError')),
  });

  const deleteFramework = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reference_frameworks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-frameworks'] });
      toast.success(t('aiGenerator.frameworkDeleted'));
    },
    onError: () => toast.error(t('aiGenerator.frameworkError')),
  });

  return {
    frameworks,
    isLoading,
    addFramework: addFramework.mutate,
    updateFramework: updateFramework.mutate,
    deleteFramework: deleteFramework.mutate,
  };
}
