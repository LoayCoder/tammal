import { StatusBadge, RISK_LEVEL_CONFIG } from '@/shared/status-badge';
import { Badge } from '@/shared/components/ui/badge';

export function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <Badge variant="outline">N/A</Badge>;
  return (
    <StatusBadge
      status={level}
      config={RISK_LEVEL_CONFIG}
      label={level.toUpperCase()}
    />
  );
}
