import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { logger } from '@/lib/logger';

export type Subscription = Tables<'subscriptions'>;
export type SubscriptionInsert = TablesInsert<'subscriptions'>;
export type SubscriptionUpdate = TablesUpdate<'subscriptions'>;

export function useSubscriptions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  const subscriptionsQuery = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          tenant:tenants(id, name),
          plan:plans(id, name, price)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (subscription: SubscriptionInsert) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscription)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('subscriptions.createSuccess'));
      logEvent({
        tenant_id: data.tenant_id,
        entity_type: 'subscription',
        entity_id: data.id,
        action: 'create',
        changes: { after: data },
      });
    },
    onError: (error) => {
      toast.error(t('subscriptions.createError'));
      logger.error('useSubscriptions', 'Create failed', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: SubscriptionUpdate & { id: string }) => {
      // Fetch current data for audit log
      const { data: before } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, before };
    },
    onSuccess: ({ data, before }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('subscriptions.updateSuccess'));
      logEvent({
        tenant_id: data.tenant_id,
        entity_type: 'subscription',
        entity_id: data.id,
        action: 'update',
        changes: { before, after: data },
      });
    },
    onError: (error) => {
      toast.error(t('subscriptions.updateError'));
      logger.error('useSubscriptions', 'Update failed', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch current data for audit log
      const { data: before } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single();

      // Soft delete
      const { error } = await supabase
        .from('subscriptions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return before;
    },
    onSuccess: (before) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('subscriptions.deleteSuccess'));
      if (before) {
        logEvent({
          tenant_id: before.tenant_id,
          entity_type: 'subscription',
          entity_id: before.id,
          action: 'delete',
          changes: { before },
        });
      }
    },
    onError: (error) => {
      toast.error(t('subscriptions.deleteError'));
      logger.error('useSubscriptions', 'Delete failed', error);
    },
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('subscriptions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        (payload) => {
          logger.debug('useSubscriptions', 'Realtime update received');
          queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    subscriptions: subscriptionsQuery.data ?? [],
    isPending: subscriptionsQuery.isPending,
    error: subscriptionsQuery.error,
    createSubscription: createMutation.mutate,
    updateSubscription: updateMutation.mutate,
    deleteSubscription: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price, billing_period')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('price');

      if (error) throw error;
      return data;
    },
  });
}
