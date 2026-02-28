import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface RedemptionOption {
  id: string;
  tenant_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string;
  points_cost: number;
  is_active: boolean | null;
  max_per_year: number | null;
  min_tenure_months: number | null;
  fulfillment_config: Record<string, any>;
  created_at: string;
  deleted_at: string | null;
}

export interface RedemptionRequest {
  id: string;
  user_id: string;
  tenant_id: string;
  option_id: string;
  points_spent: number;
  status: string;
  tracking_number: string | null;
  fulfilled_at: string | null;
  hr_notes: string | null;
  rejection_reason: string | null;
  requested_at: string;
  deleted_at: string | null;
  redemption_options?: RedemptionOption;
}

export function useRedemptionCatalog() {
  const { tenantId } = useTenantId();

  const { data: options = [], isPending } = useQuery({
    queryKey: ['redemption-options', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemption_options')
        .select('*')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('points_cost', { ascending: true });
      if (error) throw error;
      return data as RedemptionOption[];
    },
    enabled: !!tenantId,
  });

  return { options, isPending };
}

export function useRedemptionRequests() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: requests = [], isPending } = useQuery({
    queryKey: ['redemption-requests', tenantId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemption_requests')
        .select('*, redemption_options(*)')
        .is('deleted_at', null)
        .eq('user_id', user!.id)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data as RedemptionRequest[];
    },
    enabled: !!tenantId && !!user?.id,
  });

  const redeem = useMutation({
    mutationFn: async ({ optionId, pointsCost }: { optionId: string; pointsCost: number }) => {
      if (!tenantId || !user?.id) throw new Error('Missing context');
      // Use atomic server-side function for balance check + max_per_year + insert
      const { data, error } = await supabase.rpc('redeem_points', {
        p_user_id: user.id,
        p_tenant_id: tenantId,
        p_option_id: optionId,
        p_points_cost: pointsCost,
      });
      if (error) throw error;
      return data; // returns the new request id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['redemption-requests'] });
      qc.invalidateQueries({ queryKey: ['points-transactions'] });
      toast.success(t('recognition.points.redeemSuccess'));
    },
    onError: () => toast.error(t('recognition.points.redeemError')),
  });

  return { requests, isPending, redeem };
}

// Admin hooks
export function useAdminRedemptionOptions() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: options = [], isPending } = useQuery({
    queryKey: ['admin-redemption-options', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemption_options')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RedemptionOption[];
    },
    enabled: !!tenantId,
  });

  const createOption = useMutation({
    mutationFn: async (input: Omit<RedemptionOption, 'id' | 'created_at' | 'deleted_at' | 'tenant_id'>) => {
      if (!tenantId) throw new Error('Missing tenant');
      const { data, error } = await supabase
        .from('redemption_options')
        .insert({ ...input, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-redemption-options'] });
      toast.success(t('recognition.points.optionCreated'));
    },
    onError: () => toast.error(t('recognition.points.optionCreateError')),
  });

  const deleteOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('redemption_options')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-redemption-options'] });
      toast.success(t('recognition.points.optionDeleted'));
    },
    onError: () => toast.error(t('recognition.points.optionDeleteError')),
  });

  return { options, isPending, createOption, deleteOption };
}

export function useAdminRedemptionRequests() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: requests = [], isPending } = useQuery({
    queryKey: ['admin-redemption-requests', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemption_requests')
        .select('*, redemption_options(*)')
        .is('deleted_at', null)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data as RedemptionRequest[];
    },
    enabled: !!tenantId,
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status, hr_notes, rejection_reason }: { id: string; status: string; hr_notes?: string; rejection_reason?: string }) => {
      const updates: Record<string, any> = { status };
      if (hr_notes) updates.hr_notes = hr_notes;
      if (rejection_reason) updates.rejection_reason = rejection_reason;
      if (status === 'fulfilled') updates.fulfilled_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('redemption_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-redemption-requests'] });
      toast.success(t('recognition.points.requestUpdated'));
    },
    onError: () => toast.error(t('recognition.points.requestUpdateError')),
  });

  return { requests, isPending, updateRequest };
}
