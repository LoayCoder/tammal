import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { Plan } from './usePlans';

export type Tenant = Tables<'tenants'> & {
  plan?: Plan | null;
};
export type TenantInsert = TablesInsert<'tenants'>;
export type TenantUpdate = TablesUpdate<'tenants'>;

export function useTenants() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: ['tenants-full'],
    queryFn: async () => {
      // Fetch tenants with their associated plans
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      // Fetch all plans to map them
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .is('deleted_at', null);

      if (plansError) throw plansError;

      // Map plans to tenants
      const plansMap = new Map(plans?.map(p => [p.id, p]) || []);
      
      return (tenants || []).map(tenant => ({
        ...tenant,
        plan: (tenant as any).plan_id ? plansMap.get((tenant as any).plan_id) || null : null,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tenant: TenantInsert) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenant as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('tenants.createSuccess'));
    },
    onError: (error) => {
      toast.error(t('tenants.createError'));
      console.error('Create tenant error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: TenantUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('tenants.updateSuccess'));
    },
    onError: (error) => {
      toast.error(t('tenants.updateError'));
      console.error('Update tenant error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('tenants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('tenants.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(t('tenants.deleteError'));
      console.error('Delete tenant error:', error);
    },
  });

  return {
    tenants: tenantsQuery.data ?? [],
    isLoading: tenantsQuery.isLoading,
    error: tenantsQuery.error,
    createTenant: createMutation.mutate,
    updateTenant: updateMutation.mutate,
    deleteTenant: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
