import { StatusBadge, ACCOUNT_STATUS_CONFIG } from '@/shared/status-badge';
export type { AccountStatus } from '@/shared/types/common.types/employee';
import type { AccountStatus } from '@/shared/types/common.types/employee';

interface AccountStatusBadgeProps {
  status: AccountStatus;
}

export function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={ACCOUNT_STATUS_CONFIG}
      showIcon
    />
  );
}

