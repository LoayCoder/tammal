import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Home, Building2, Briefcase, X, Clock } from 'lucide-react';
import type { PrayerLog } from '@/hooks/usePrayerLogs';

interface PrayerCardProps {
  prayerName: string;
  prayerTime: string;
  log?: PrayerLog;
  onLog: (status: string) => void;
  isPending?: boolean;
}

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<any>; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed_mosque: { icon: Building2, variant: 'default' },
  completed_home: { icon: Home, variant: 'default' },
  completed_work: { icon: Briefcase, variant: 'default' },
  missed: { icon: X, variant: 'destructive' },
};

export function PrayerCard({ prayerName, prayerTime, log, onLog, isPending }: PrayerCardProps) {
  const { t } = useTranslation();

  const isLogged = !!log;
  const isCompleted = log?.status?.startsWith('completed');

  const prayerNameKey = prayerName.toLowerCase();

  return (
    <Card className={isCompleted ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">
              {t(`spiritual.prayer.names.${prayerNameKey}`)}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {prayerTime}
            </p>
          </div>
          {isLogged && (
            <Badge variant={isCompleted ? 'default' : 'destructive'}>
              {isCompleted ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {t(`spiritual.prayer.status.${log.status}`)}
                </span>
              ) : (
                t(`spiritual.prayer.status.${log.status}`)
              )}
            </Badge>
          )}
        </div>

        {!isLogged && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLog('completed_mosque')}
              disabled={isPending}
              className="gap-1"
            >
              <Building2 className="h-3.5 w-3.5" />
              {t('spiritual.prayer.mosque')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLog('completed_home')}
              disabled={isPending}
              className="gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              {t('spiritual.prayer.home')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLog('completed_work')}
              disabled={isPending}
              className="gap-1"
            >
              <Briefcase className="h-3.5 w-3.5" />
              {t('spiritual.prayer.work')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onLog('missed')}
              disabled={isPending}
              className="text-muted-foreground"
            >
              {t('spiritual.prayer.missed')}
            </Button>
          </div>
        )}

        {isLogged && !isCompleted && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLog('completed_mosque')}
              disabled={isPending}
              className="gap-1"
            >
              <Building2 className="h-3.5 w-3.5" />
              {t('spiritual.prayer.logNow')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
