import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Building2, Briefcase, Clock } from 'lucide-react';
import type { PrayerLog } from '@/hooks/usePrayerLogs';
import { PrayerStatusBadge } from './PrayerStatusBadge';

interface PrayerCardProps {
  prayerName: string;
  prayerTime: string;
  log?: PrayerLog;
  onLog: (status: string) => void;
  isPending?: boolean;
}

const BORDER_COLORS: Record<string, string> = {
  completed_mosque: 'border-emerald-500/30',
  completed_home:   'border-amber-500/30',
  completed_work:   'border-gray-500/30',
  missed:           'border-red-500/30',
};

export function PrayerCard({ prayerName, prayerTime, log, onLog, isPending }: PrayerCardProps) {
  const { t } = useTranslation();

  const isLogged = !!log;
  const borderClass = log ? BORDER_COLORS[log.status] ?? '' : '';
  const prayerNameKey = prayerName.toLowerCase();

  return (
    <Card className={`transition-all duration-300 ${borderClass}`}>
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
          {isLogged && <PrayerStatusBadge status={log.status} />}
        </div>

        {!isLogged && (
          <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
            <Button size="sm" variant="outline" onClick={() => onLog('completed_mosque')} disabled={isPending} className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {t('spiritual.prayer.mosque')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onLog('completed_home')} disabled={isPending} className="gap-1">
              <Home className="h-3.5 w-3.5" />
              {t('spiritual.prayer.home')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onLog('completed_work')} disabled={isPending} className="gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {t('spiritual.prayer.work')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onLog('missed')} disabled={isPending} className="text-muted-foreground">
              {t('spiritual.prayer.missed')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
