import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { CycleStatus } from '@/hooks/recognition/useAwardCycles';

const STATUS_VARIANT: Record<CycleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  configuring: 'outline',
  nominating: 'default',
  voting: 'default',
  calculating: 'secondary',
  announced: 'default',
  archived: 'secondary',
};

export function CycleStatusBadge({ status }: { status: CycleStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'outline'}>
      {t(`recognition.status.${status}`)}
    </Badge>
  );
}
