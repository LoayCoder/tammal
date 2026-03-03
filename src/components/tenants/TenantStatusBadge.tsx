import { StatusBadge, TENANT_STATUS_CONFIG } from '@/shared/status-badge';

interface TenantStatusBadgeProps {
  status: string;
}

export function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={TENANT_STATUS_CONFIG}
      translationPrefix="common"
    />
  );
}
