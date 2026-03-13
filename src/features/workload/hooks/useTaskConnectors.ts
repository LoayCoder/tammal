import { useQuery } from '@tanstack/react-query';
import { fetchTaskConnectors, Connector } from '../services/task-connectors.service';

export type { Connector };

export function useTaskConnectors(tenantId?: string) {
  return useQuery({
    queryKey: ['task-connectors', tenantId],
    queryFn: () => fetchTaskConnectors(tenantId),
    enabled: !!tenantId,
  });
}
