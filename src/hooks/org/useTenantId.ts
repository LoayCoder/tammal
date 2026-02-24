import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Centralized hook for fetching the current user's tenant_id.
 * Caches via React Query — all consumers share one request.
 */
export function useTenantId() {
  const { user } = useAuth();

  const { data: tenantId, isLoading } = useQuery({
    queryKey: ['tenant-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data?.tenant_id ?? null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return { tenantId: tenantId ?? null, isLoading };
}
