import { StatusBadge, EMPLOYEE_STATUS_CONFIG } from '@/shared/status-badge';
import { EmployeeStatus } from '@/hooks/org/useEmployees';

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
}

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={EMPLOYEE_STATUS_CONFIG}
      translationPrefix="employees.status"
    />
  );
}
