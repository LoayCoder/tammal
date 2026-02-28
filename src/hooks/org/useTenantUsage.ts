import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type TenantUsage = Tables<'tenant_usage'>;

interface UsageWithTrend extends TenantUsage {
  usersTrend?: number;
  storageTrend?: number;
  apiCallsTrend?: number;
}

export function useTenantUsage(tenantId?: string) {
  const usageQuery = useQuery({
    queryKey: ['tenant-usage', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Get current period usage
      const { data: currentUsage, error: currentError } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('period_start', { ascending: false })
        .limit(2);

      if (currentError) throw currentError;

      if (!currentUsage || currentUsage.length === 0) {
        return null;
      }

      const current = currentUsage[0] as TenantUsage;
      const previous = currentUsage.length > 1 ? currentUsage[1] as TenantUsage : null;

      // Calculate trends
      const result: UsageWithTrend = {
        ...current,
        usersTrend: previous && previous.active_users 
          ? Math.round(((current.active_users - previous.active_users) / previous.active_users) * 100)
          : undefined,
        storageTrend: previous && Number(previous.storage_used_mb) > 0
          ? Math.round(((Number(current.storage_used_mb) - Number(previous.storage_used_mb)) / Number(previous.storage_used_mb)) * 100)
          : undefined,
        apiCallsTrend: previous && previous.api_calls
          ? Math.round(((current.api_calls - previous.api_calls) / previous.api_calls) * 100)
          : undefined,
      };

      return result;
    },
    enabled: !!tenantId,
  });

  const usageHistoryQuery = useQuery({
    queryKey: ['tenant-usage-history', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('period_start', { ascending: true })
        .limit(12);

      if (error) throw error;
      return data as TenantUsage[];
    },
    enabled: !!tenantId,
  });

  return {
    usage: usageQuery.data,
    history: usageHistoryQuery.data ?? [],
    isPending: usageQuery.isPending && usageQuery.isFetching,
    isPendingHistory: usageHistoryQuery.isPending && usageHistoryQuery.isFetching,
    error: usageQuery.error,
  };
}
