import { StatusBadge, CYCLE_STATUS_CONFIG } from '@/shared/status-badge';
import type { CycleStatus } from '@/hooks/recognition/useAwardCycles';

export function CycleStatusBadge({ status }: { status: CycleStatus }) {
  return (
    <StatusBadge
      status={status}
      config={CYCLE_STATUS_CONFIG}
      translationPrefix="recognition.status"
    />
  );
}
