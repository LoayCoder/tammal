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

const STATUS_STYLES: Record<string, { border: string; bg: string }> = {
  completed_mosque: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/20' },
  completed_home:   { border: 'border-amber-500/40',   bg: 'bg-amber-500/20' },
  completed_work:   { border: 'border-gray-500/40',     bg: 'bg-gray-500/20' },
  missed:           { border: 'border-red-500/40',       bg: 'bg-red-500/20' },
};

export function PrayerCard({ prayerName, prayerTime, log, onLog, isPending }: PrayerCardProps) {
  const { t } = useTranslation();

  const isLogged = !!log;
  const style = log ? STATUS_STYLES[log.status] : null;
  const cardClass = style ? `${style.border} ${style.bg}` : '';
  const prayerNameKey = prayerName.toLowerCase();

  return (
    <Card className={`glass-card border rounded-xl transition-all duration-300 ${cardClass}`}>
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
