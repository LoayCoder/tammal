import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Building2, Briefcase, Clock, Check } from 'lucide-react';
import type { PrayerLog } from '@/hooks/spiritual/usePrayerLogs';
import { PrayerStatusBadge } from './PrayerStatusBadge';
import { cn } from '@/lib/utils';

const RAWATIB_CONFIG: Record<string, { before?: number; after?: number }> = {
  Fajr:    { after: 2 },
  Dhuhr:   { before: 2, after: 2 },
  Asr:     {},
  Maghrib: { after: 2 },
  Isha:    { after: 2 },
};

interface PrayerCardProps {
  prayerName: string;
  prayerTime: string;
  log?: PrayerLog;
  onLog: (status: string) => void;
  isPending?: boolean;
  sunnahBefore?: boolean;
  sunnahAfter?: boolean;
  onToggleSunnah?: (type: 'before' | 'after', completed: boolean) => void;
  sunnahPending?: boolean;
}

const STATUS_STYLES: Record<string, { border: string; bg: string }> = {
  completed_mosque: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.01]' },
  completed_home:   { border: 'border-amber-500/40',   bg: 'bg-amber-500/[0.01]' },
  completed_work:   { border: 'border-gray-500/40',     bg: 'bg-gray-500/[0.01]' },
  missed:           { border: 'border-red-500/40',       bg: 'bg-red-500/[0.01]' },
};

export function PrayerCard({ prayerName, prayerTime, log, onLog, isPending, sunnahBefore, sunnahAfter, onToggleSunnah, sunnahPending }: PrayerCardProps) {
  const { t, i18n } = useTranslation();

  const isLogged = !!log;
  const style = log ? STATUS_STYLES[log.status] : null;
  const cardClass = style ? `${style.border} ${style.bg}` : '';
  const prayerNameKey = prayerName.toLowerCase();
  const rawatib = RAWATIB_CONFIG[prayerName];
  const hasRawatib = rawatib && (rawatib.before || rawatib.after);

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

        {/* Rawatib Sunnah toggles */}
        {hasRawatib && onToggleSunnah && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
            {rawatib.before && (
              <button
                onClick={() => onToggleSunnah('before', !sunnahBefore)}
                disabled={sunnahPending}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200',
                  sunnahBefore
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                )}
              >
                📿
                {sunnahBefore && <Check className="h-3 w-3" />}
                <span>
                  {i18n.language === 'ar'
                    ? `${rawatib.before} ركعات قبل`
                    : `${rawatib.before} Rak'ahs before`}
                </span>
              </button>
            )}
            {rawatib.after && (
              <button
                onClick={() => onToggleSunnah('after', !sunnahAfter)}
                disabled={sunnahPending}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200',
                  sunnahAfter
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                )}
              >
                📿
                {sunnahAfter && <Check className="h-3 w-3" />}
                <span>
                  {i18n.language === 'ar'
                    ? `${rawatib.after} ركعات بعد`
                    : `${rawatib.after} Rak'ahs after`}
                </span>
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
