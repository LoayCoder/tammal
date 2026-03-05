import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantId } from '@/hooks/org/useTenantId';
import { runAllHealthChecks, type HealthCheckKey, type HealthCheckResult } from '@/services/governance-health.service';

export function useSystemHealth() {
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system-health', tenantId],
    queryFn: () => runAllHealthChecks(tenantId!),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // auto-refresh every 5 min
  });

  const runHealthCheck = useMutation({
    mutationFn: () => runAllHealthChecks(tenantId!),
    onSuccess: (data) => {
      queryClient.setQueryData(['system-health', tenantId], data);
    },
  });

  return {
    checks: query.data as Record<HealthCheckKey, HealthCheckResult> | undefined,
    isPending: query.isPending,
    runHealthCheck,
  };
}
