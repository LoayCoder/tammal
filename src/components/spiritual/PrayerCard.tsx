import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Building2, Briefcase, Clock, Check, Pencil, Timer } from 'lucide-react';
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
  /** Optional override label for the time display (e.g. range like "10:00 PM – 4:30") */
  timeLabel?: string;
  log?: PrayerLog;
  onLog: (status: string) => void;
  isPending?: boolean;
  sunnahBefore?: boolean;
  sunnahAfter?: boolean;
  onToggleSunnah?: (type: 'before' | 'after', completed: boolean) => void;
  sunnahPending?: boolean;
  // Countdown props
  countdownMinutes?: number | null;
  isExpired?: boolean;
  isPrayerTime?: boolean;
  onAutoMiss?: () => void;
}

const STATUS_STYLES: Record<string, { border: string; bg: string }> = {
  completed_mosque: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.01]' },
  completed_home:   { border: 'border-amber-500/40',   bg: 'bg-amber-500/[0.01]' },
  completed_work:   { border: 'border-gray-500/40',     bg: 'bg-gray-500/[0.01]' },
  missed:           { border: 'border-red-500/40',       bg: 'bg-red-500/[0.01]' },
};

export function PrayerCard({
  prayerName, prayerTime, timeLabel, log, onLog, isPending,
  sunnahBefore, sunnahAfter, onToggleSunnah, sunnahPending,
  countdownMinutes, isExpired, isPrayerTime: isPrayerTimeFlag, onAutoMiss,
}: PrayerCardProps) {
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState(false);
  const autoMissedRef = useRef(false);

  const isLogged = !!log;
  const style = log ? STATUS_STYLES[log.status] : null;
  const cardClass = style ? `${style.border} ${style.bg}` : '';
  const prayerNameKey = prayerName.toLowerCase();
  const rawatib = RAWATIB_CONFIG[prayerName];
  const hasRawatib = rawatib && (rawatib.before || rawatib.after);

  // Auto-miss logic
  useEffect(() => {
    if (isExpired && !isLogged && !autoMissedRef.current && onAutoMiss) {
      autoMissedRef.current = true;
      onAutoMiss();
    }
  }, [isExpired, isLogged, onAutoMiss]);

  // Reset autoMissedRef when date changes (new day)
  useEffect(() => {
    autoMissedRef.current = false;
  }, [prayerTime]);

  const showButtons = !isLogged || editing;

  const handleLog = (status: string) => {
    onLog(status);
    setEditing(false);
  };

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
              {timeLabel || prayerTime}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Countdown badge */}
            {!isLogged && isPrayerTimeFlag && !isExpired && countdownMinutes != null && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                <Timer className="h-3 w-3" />
                {i18n.language === 'ar' ? `${countdownMinutes}د` : `${countdownMinutes}m`}
              </span>
            )}
            {/* Upcoming badge */}
            {!isLogged && !isPrayerTimeFlag && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {i18n.language === 'ar' ? 'قادمة' : 'Upcoming'}
              </span>
            )}
            {isLogged && !editing && <PrayerStatusBadge status={log.status} />}
          </div>
        </div>

        {/* Action buttons */}
        {showButtons && (
          <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
            <Button size="sm" variant="outline" onClick={() => handleLog('completed_mosque')} disabled={isPending} className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {t('spiritual.prayer.mosque')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleLog('completed_home')} disabled={isPending} className="gap-1">
              <Home className="h-3.5 w-3.5" />
              {t('spiritual.prayer.home')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleLog('completed_work')} disabled={isPending} className="gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {t('spiritual.prayer.work')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleLog('missed')} disabled={isPending} className="text-muted-foreground">
              {t('spiritual.prayer.missed')}
            </Button>
          </div>
        )}

        {/* Edit button for logged prayers */}
        {isLogged && !editing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="gap-1 text-xs text-muted-foreground h-7"
          >
            <Pencil className="h-3 w-3" />
            {i18n.language === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
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
