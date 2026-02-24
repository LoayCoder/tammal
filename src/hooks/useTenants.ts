import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { Plan } from './usePlans';
import { useAuditLog } from './useAuditLog';
import { addDays } from 'date-fns';
import type { SecuritySettings } from '@/components/tenants/TenantSecurityControl';

export type Tenant = Tables<'tenants'> & {
  plan?: Plan | null;
};
export type TenantInsert = TablesInsert<'tenants'>;
export type TenantUpdate = TablesUpdate<'tenants'>;

export function useTenants() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

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
        plan: tenant.plan_id ? plansMap.get(tenant.plan_id) || null : null,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('tenants.createSuccess'));
      
      // Log audit event
      logEvent({
        tenant_id: data.id,
        entity_type: 'tenant',
        entity_id: data.id,
        action: 'create',
        changes: { after: data },
      });
    },
    onError: (error) => {
      toast.error(t('tenants.createError'));
      console.error('Create tenant error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: TenantUpdate & { id: string }) => {
      // Fetch current state for audit logging
      const { data: before } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('tenants')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, before };
    },
    onSuccess: ({ data, before }) => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('tenants.updateSuccess'));
      
      // Determine action type
      const beforeSettings = before?.settings as any;
      const afterSettings = data.settings as any;
      const isModuleToggle = beforeSettings?.modules && afterSettings?.modules &&
        JSON.stringify(beforeSettings.modules) !== JSON.stringify(afterSettings.modules);
      const isStatusChange = before?.status !== data.status;
      
      logEvent({
        tenant_id: data.id,
        entity_type: 'tenant',
        entity_id: data.id,
        action: isModuleToggle ? 'module_toggle' : isStatusChange ? 'status_change' : 'update',
        changes: { before, after: data },
      });
    },
    onError: (error) => {
      toast.error(t('tenants.updateError'));
      console.error('Update tenant error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch current state for audit logging
      const { data: before } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();

      // Soft delete
      const { error } = await supabase
        .from('tenants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { id, before };
    },
    onSuccess: ({ id, before }) => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('tenants.deleteSuccess'));
      
      logEvent({
        tenant_id: id,
        entity_type: 'tenant',
        entity_id: id,
        action: 'delete',
        changes: { before },
      });
    },
    onError: (error) => {
      toast.error(t('tenants.deleteError'));
      console.error('Delete tenant error:', error);
    },
  });

  // Trial Management
  const startTrialMutation = useMutation({
    mutationFn: async ({ tenantId, days }: { tenantId: string; days: number }) => {
      const now = new Date();
      const endDate = addDays(now, days);

      const { data, error } = await supabase
        .from('tenants')
        .update({
          subscription_status: 'trialing',
          trial_start_date: now.toISOString(),
          trial_end_date: endDate.toISOString(),
        } as any)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      toast.success(t('tenants.trialStarted'));
    },
    onError: (error) => {
      toast.error(t('tenants.updateError'));
      console.error('Start trial error:', error);
    },
  });

  const extendTrialMutation = useMutation({
    mutationFn: async ({ tenantId, days, endDate }: { tenantId: string; days?: number; endDate?: string }) => {
      // Get current trial end date
      const { data: tenant } = await supabase
        .from('tenants')
        .select('trial_end_date')
        .eq('id', tenantId)
        .single();

      let newEndDate: Date;
      if (endDate) {
        newEndDate = new Date(endDate);
      } else if (days && tenant?.trial_end_date) {
        newEndDate = addDays(new Date(tenant.trial_end_date), days);
      } else {
        throw new Error('Either days or endDate must be provided');
      }

      const { data, error } = await supabase
        .from('tenants')
        .update({
          trial_end_date: newEndDate.toISOString(),
        } as any)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      toast.success(t('tenants.trialExtended'));
    },
    onError: (error) => {
      toast.error(t('tenants.updateError'));
      console.error('Extend trial error:', error);
    },
  });

  const endTrialMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const { data, error } = await supabase
        .from('tenants')
        .update({
          subscription_status: 'inactive',
        } as any)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      toast.success(t('tenants.trialEnded'));
    },
    onError: (error) => {
      toast.error(t('tenants.updateError'));
      console.error('End trial error:', error);
    },
  });

  // Security Settings
  const updateSecurityMutation = useMutation({
    mutationFn: async ({ tenantId, settings }: { tenantId: string; settings: SecuritySettings }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(settings as any)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-full'] });
      toast.success(t('tenants.updateSuccess'));
    },
    onError: (error) => {
      toast.error(t('tenants.updateError'));
      console.error('Update security error:', error);
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
    // Trial management
    startTrial: startTrialMutation.mutate,
    extendTrial: extendTrialMutation.mutate,
    endTrial: endTrialMutation.mutate,
    isTrialUpdating: startTrialMutation.isPending || extendTrialMutation.isPending || endTrialMutation.isPending,
    // Security settings
    updateSecuritySettings: updateSecurityMutation.mutate,
    isSecurityUpdating: updateSecurityMutation.isPending,
  };
}
