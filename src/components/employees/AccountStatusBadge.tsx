import { StatusBadge, ACCOUNT_STATUS_CONFIG } from '@/shared/status-badge';

export type AccountStatus = 'not_invited' | 'invited' | 'active' | 'suspended' | 'inactive';

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
