import { StatusBadge, PRAYER_STATUS_CONFIG } from '@/shared/status-badge';

interface PrayerStatusBadgeProps {
  status: string;
}

export function PrayerStatusBadge({ status }: PrayerStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={PRAYER_STATUS_CONFIG}
      translationPrefix="spiritual.prayer.status"
      showIcon
    />
  );
}
