import { useQuery } from '@tanstack/react-query';
import { fetchDepartments, fetchEmployees, type ScheduleEmployee } from '@/services/scheduleService';

export function useScheduleData(tenantId: string | undefined) {
  const departments = useQuery({
    queryKey: ['schedule-departments', tenantId],
    queryFn: () => fetchDepartments(tenantId!),
    enabled: !!tenantId,
  });

  const employees = useQuery({
    queryKey: ['schedule-employees', tenantId],
    queryFn: () => fetchEmployees(tenantId!),
    enabled: !!tenantId,
  });

  return {
    availableDepartments: departments.data || [],
    availableEmployees: employees.data || [],
    isLoadingDepartments: departments.isPending,
    isLoadingEmployees: employees.isPending,
  };
}

export type { ScheduleEmployee };
