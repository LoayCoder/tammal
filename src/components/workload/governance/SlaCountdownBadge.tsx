import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { differenceInHours, differenceInDays, differenceInMinutes } from 'date-fns';
import { Clock } from 'lucide-react';

interface Props {
  dueDate: string | null;
  completedAt?: string | null;
  className?: string;
}

export function SlaCountdownBadge({ dueDate, completedAt, className }: Props) {
  const { t } = useTranslation();

  if (!dueDate || completedAt) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const totalMinutes = differenceInMinutes(due, now);

  if (totalMinutes <= 0) {
    const overdueDays = Math.abs(differenceInDays(due, now));
    return (
      <Badge variant="destructive" className={`gap-1 text-2xs py-0 px-1.5 ${className ?? ''}`}>
        <Clock className="h-2.5 w-2.5" />
        {overdueDays > 0 ? `${overdueDays}d ${t('governance.sla.overdue')}` : t('governance.sla.breached')}
      </Badge>
    );
  }

  const days = differenceInDays(due, now);
  const hours = differenceInHours(due, now) % 24;

  // Approaching: <= 2 days
  if (days <= 2) {
    const label = days > 0 ? `${days}d ${hours}h` : `${differenceInHours(due, now)}h`;
    return (
      <Badge className={`gap-1 text-2xs py-0 px-1.5 bg-chart-5/10 text-chart-5 border-chart-5/20 ${className ?? ''}`}>
        <Clock className="h-2.5 w-2.5" />
        {label} {t('governance.sla.left')}
      </Badge>
    );
  }

  // Safe: > 2 days
  return (
    <Badge variant="outline" className={`gap-1 text-2xs py-0 px-1.5 text-chart-2 border-chart-2/20 ${className ?? ''}`}>
      <Clock className="h-2.5 w-2.5" />
      {days}d {t('governance.sla.left')}
    </Badge>
  );
}
