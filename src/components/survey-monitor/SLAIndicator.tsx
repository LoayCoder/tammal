import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInHours, differenceInDays, isPast } from 'date-fns';

interface Props {
  startDate?: string | null;
  endDate?: string | null;
}

export function SLAIndicator({ startDate, endDate }: Props) {
  const { t } = useTranslation();

  if (!startDate && !endDate) {
    return null;
  }

  const now = new Date();
  const end = endDate ? parseISO(endDate) : null;
  const start = startDate ? parseISO(startDate) : null;

  const isExpired = end ? isPast(end) : false;
  const hoursRemaining = end ? differenceInHours(end, now) : null;
  const daysRemaining = end ? differenceInDays(end, now) : null;
  const isNearDeadline = hoursRemaining !== null && hoursRemaining > 0 && hoursRemaining <= 24;

  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardContent className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('surveyMonitor.sla.window')}</span>
        </div>

        {start && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('common.from')}: </span>
            <span>{format(start, 'MMM dd, yyyy')}</span>
          </div>
        )}

        {end && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('common.to')}: </span>
            <span>{format(end, 'MMM dd, yyyy')}</span>
          </div>
        )}

        {isExpired && (
          <Badge variant="destructive">{t('surveyMonitor.sla.expired')}</Badge>
        )}
        {isNearDeadline && !isExpired && (
          <Badge variant="outline" className="border-destructive text-destructive gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t('surveyMonitor.sla.nearDeadline', { hours: hoursRemaining })}
          </Badge>
        )}
        {!isExpired && !isNearDeadline && daysRemaining !== null && daysRemaining > 0 && (
          <Badge variant="secondary">
            {t('surveyMonitor.sla.daysLeft', { days: daysRemaining })}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
