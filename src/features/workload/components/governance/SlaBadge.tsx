import { Badge } from '@/shared/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';

export type SlaStatus = 'within_sla' | 'approaching' | 'breached';

export function getSlaStatus(dueDate: string | null, completedAt?: string | null): SlaStatus {
  if (!dueDate) return 'within_sla';
  if (completedAt) return 'within_sla';
  const daysLeft = differenceInDays(new Date(dueDate), new Date());
  if (daysLeft < 0) return 'breached';
  if (daysLeft <= 2) return 'approaching';
  return 'within_sla';
}

const variantMap: Record<SlaStatus, 'default' | 'secondary' | 'destructive'> = {
  within_sla: 'default',
  approaching: 'secondary',
  breached: 'destructive',
};

interface Props {
  dueDate: string | null;
  completedAt?: string | null;
  className?: string;
}

export function SlaBadge({ dueDate, completedAt, className }: Props) {
  const { t } = useTranslation();
  const status = getSlaStatus(dueDate, completedAt);

  return (
    <Badge variant={variantMap[status]} className={className}>
      {t(`governance.sla.${status}`)}
    </Badge>
  );
}
