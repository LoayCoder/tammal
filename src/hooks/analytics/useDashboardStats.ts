import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface DashboardStats {
  totalTenants: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  subscriptionsByStatus: Record<string, number>;
  tenantsByStatus: Record<string, number>;
}

export function useDashboardStats() {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch tenants count
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, status')
        .is('deleted_at', null);

      if (tenantsError) throw tenantsError;

      // Fetch subscriptions with plans
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          plan:plans(price)
        `)
        .is('deleted_at', null);

      if (subscriptionsError) throw subscriptionsError;

      // Calculate stats
      const totalTenants = tenants?.length ?? 0;
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length ?? 0;
      
      // Calculate monthly revenue from active subscriptions
      const monthlyRevenue = subscriptions
        ?.filter(s => s.status === 'active')
        .reduce((sum, sub) => {
          const price = (sub.plan as any)?.price ?? 0;
          return sum + Number(price);
        }, 0) ?? 0;

      // Group subscriptions by status
      const subscriptionsByStatus: Record<string, number> = {};
      subscriptions?.forEach(sub => {
        subscriptionsByStatus[sub.status] = (subscriptionsByStatus[sub.status] || 0) + 1;
      });

      // Group tenants by status
      const tenantsByStatus: Record<string, number> = {};
      tenants?.forEach(tenant => {
        const status = tenant.status || 'unknown';
        tenantsByStatus[status] = (tenantsByStatus[status] || 0) + 1;
      });

      return {
        totalTenants,
        activeSubscriptions,
        monthlyRevenue,
        subscriptionsByStatus,
        tenantsByStatus,
      };
    },
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    stats: statsQuery.data,
    isPending: statsQuery.isPending,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
}
