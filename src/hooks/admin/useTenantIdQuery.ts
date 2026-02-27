import { useQuery } from '@tanstack/react-query';
import { getTenantIdForUser } from '@/services/tenantService';

/**
 * Hook to get tenant ID using the RPC function (for admin pages).
 * Different from useTenantId which uses profiles table directly.
 */
export function useTenantIdQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-tenant-id', userId],
    queryFn: () => getTenantIdForUser(userId!),
    enabled: !!userId,
  });
}
