import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Home, Briefcase, ChevronRight, Clock, Timer, Check } from 'lucide-react';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { usePrayerTimes, PRAYER_NAMES } from '@/hooks/spiritual/usePrayerTimes';
import { usePrayerLogs } from '@/hooks/spiritual/usePrayerLogs';
import { usePrayerCountdown } from '@/hooks/spiritual/usePrayerCountdown';
import { useSunnahLogs } from '@/hooks/spiritual/useSunnahLogs';
import { cn } from '@/lib/utils';

const RAWATIB_CONFIG: Record<string, { before?: number; after?: number }> = {
  Fajr:    { before: 2 },
  Dhuhr:   { before: 2, after: 2 },
  Asr:     {},
  Maghrib: { after: 2 },
  Isha:    { after: 2 },
};

function PrayerCountdownBadge({ prayerTime }: { prayerTime: string }) {
  const { minutesLeft, isExpired, isPrayerTime } = usePrayerCountdown(prayerTime);
  const { i18n } = useTranslation();

  if (!isPrayerTime || isExpired || minutesLeft == null) return null;

  return (
    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
      <Timer className="h-3 w-3" />
      {i18n.language === 'ar' ? `${minutesLeft}د` : `${minutesLeft}m`}
    </span>
  );
}

export function DashboardPrayerWidget() {
  const { t, i18n } = useTranslation();
  const { isPrayerEnabled, preferences } = useSpiritualPreferences();
  const { data: prayerData } = usePrayerTimes(
    preferences?.city,
    preferences?.country,
    preferences?.calculation_method
  );
  const { todayLogs, logPrayer } = usePrayerLogs();
  const { todayCompleted, togglePractice } = useSunnahLogs();

  const timings = prayerData?.timings;
  const hijri = prayerData?.date?.hijri;

  // Determine active prayer (first unlogged whose time has passed, or next upcoming)
  const activePrayer = useMemo(() => {
    if (!timings) return null;
    const now = new Date();

    // Find first unlogged prayer whose time has arrived
    for (const name of PRAYER_NAMES) {
      if (todayLogs[name]) continue;
      const clean = (timings[name] || '').replace(/\s*\(.*\)/, '').trim();
      const [h, m] = clean.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) continue;
      const pDate = new Date(now);
      pDate.setHours(h, m, 0, 0);
      if (now >= pDate) return name;
    }

    // Find next upcoming unlogged prayer
    for (const name of PRAYER_NAMES) {
      if (todayLogs[name]) continue;
      return name;
    }

    return null; // All logged
  }, [timings, todayLogs]);

  if (!isPrayerEnabled || !timings) return null;

  const today = new Date().toISOString().split('T')[0];
  const completedCount = PRAYER_NAMES.filter(n => todayLogs[n]).length;

  const handleLog = (status: string) => {
    if (!activePrayer) return;
    logPrayer.mutate({ prayer_name: activePrayer, prayer_date: today, status });
  };

  const handleToggleSunnah = (type: 'before' | 'after', completed: boolean) => {
    if (!activePrayer) return;
    togglePractice.mutate({ practice_type: `rawatib_${activePrayer.toLowerCase()}_${type}`, completed });
  };

  const activeRawatib = activePrayer ? RAWATIB_CONFIG[activePrayer] : null;
  const hasActiveRawatib = activeRawatib && (activeRawatib.before || activeRawatib.after);

  return (
    <Card className="glass-card border-0 ring-1 ring-primary/20">
      <CardContent className="p-5 space-y-4">
        {/* Header with Hijri date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕌</span>
            <div>
              <h3 className="font-semibold text-sm">{t('spiritual.prayer.title')}</h3>
              {hijri && (
                <p className="text-xs text-muted-foreground">
                  {i18n.language === 'ar'
                    ? `${hijri.day} ${hijri.month.ar} ${hijri.year}`
                    : `${hijri.day} ${hijri.month.en} ${hijri.year}`}
                </p>
              )}
            </div>
          </div>
          <Link to="/spiritual/prayer">
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
              {t('common.more')}
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>

        {/* Active prayer card */}
        {activePrayer ? (
          <div className="rounded-xl bg-muted/50 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">
                  {t(`spiritual.prayer.names.${activePrayer.toLowerCase()}`)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {(timings[activePrayer] || '').replace(/\s*\(.*\)/, '').trim()}
                </p>
              </div>
              <PrayerCountdownBadge prayerTime={timings[activePrayer]} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" onClick={() => handleLog('completed_mosque')} disabled={logPrayer.isPending} className="gap-1 h-7 text-xs">
                <Building2 className="h-3 w-3" /> {t('spiritual.prayer.mosque')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleLog('completed_home')} disabled={logPrayer.isPending} className="gap-1 h-7 text-xs">
                <Home className="h-3 w-3" /> {t('spiritual.prayer.home')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleLog('completed_work')} disabled={logPrayer.isPending} className="gap-1 h-7 text-xs">
                <Briefcase className="h-3 w-3" /> {t('spiritual.prayer.work')}
              </Button>
            </div>
            {/* Rawatib Sunnah toggles */}
            {hasActiveRawatib && (
              <div className="flex flex-wrap gap-1.5">
                {activeRawatib.before && (
                  <button
                    onClick={() => handleToggleSunnah('before', !todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_before`))}
                    disabled={togglePractice.isPending}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-all duration-200',
                      todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_before`)
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    📿
                    {todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_before`) && <Check className="h-3 w-3" />}
                    <span>{i18n.language === 'ar' ? `${activeRawatib.before} ركعات قبل` : `${activeRawatib.before} Rak'ahs before`}</span>
                  </button>
                )}
                {activeRawatib.after && (
                  <button
                    onClick={() => handleToggleSunnah('after', !todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_after`))}
                    disabled={togglePractice.isPending}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-all duration-200',
                      todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_after`)
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    📿
                    {todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_after`) && <Check className="h-3 w-3" />}
                    <span>{i18n.language === 'ar' ? `${activeRawatib.after} ركعات بعد` : `${activeRawatib.after} Rak'ahs after`}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-chart-1/10 via-primary/5 to-chart-1/10 border border-chart-1/20 p-4 text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🎉</span>
              <p className="text-sm font-bold text-chart-1">
                {i18n.language === 'ar' ? 'ما شاء الله! أكملت جميع الصلوات' : 'Masha\'Allah! All prayers completed!'}
              </p>
              <span className="text-2xl">🎉</span>
            </div>
            <div className="rounded-lg bg-background/60 backdrop-blur-sm border border-border/50 p-3 space-y-1">
              <p className="text-xs font-semibold text-primary">📖 {i18n.language === 'ar' ? 'حديث شريف' : 'Hadith'}</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                {i18n.language === 'ar'
                  ? '«أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ مِنْهُ كُلَّ يَوْمٍ خَمْسَ مَرَّاتٍ، هَلْ يَبْقَى مِنْ دَرَنِهِ شَيْءٌ؟» قَالُوا: لاَ يَبْقَى مِنْ دَرَنِهِ شَيْءٌ. قَالَ: «فَذَلِكَ مَثَلُ الصَّلَوَاتِ الْخَمْسِ، يَمْحُو اللَّهُ بِهِنَّ الْخَطَايَا»'
                  : '"If there was a river at the door of anyone of you and he took a bath in it five times a day, would any dirt remain on him?" They said, "No." He ﷺ said, "That is the example of the five prayers with which Allah erases sins."'}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                {i18n.language === 'ar' ? '— متفق عليه' : '— Agreed upon (Bukhari & Muslim)'}
              </p>
            </div>
          </div>
        )}

        {/* Progress row — 5 prayer indicators */}
        <div className="flex items-center justify-between gap-1">
        {PRAYER_NAMES.map(name => {
            const logged = !!todayLogs[name];
            const isMissed = todayLogs[name]?.status === 'missed';
            const isActive = name === activePrayer;
            const rawatib = RAWATIB_CONFIG[name];
            const hasBefore = !!rawatib?.before;
            const hasAfter = !!rawatib?.after;
            const beforeDone = todayCompleted.has(`rawatib_${name.toLowerCase()}_before`);
            const afterDone = todayCompleted.has(`rawatib_${name.toLowerCase()}_after`);
            return (
              <div key={name} className="flex flex-col items-center gap-0.5 flex-1">
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs border transition-all',
                    logged && !isMissed && 'bg-chart-1/20 border-chart-1/40 text-chart-1',
                    isMissed && 'bg-destructive/10 border-destructive/30 text-destructive',
                    !logged && isActive && 'bg-primary/10 border-primary/40 text-primary ring-2 ring-primary/20',
                    !logged && !isActive && 'bg-muted border-border text-muted-foreground',
                  )}
                >
                  {logged && !isMissed ? <Check className="h-3 w-3" /> : null}
                  {isMissed ? '✕' : null}
                  {!logged && isActive ? <Timer className="h-3 w-3" /> : null}
                </div>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {t(`spiritual.prayer.names.${name.toLowerCase()}`).slice(0, 3)}
                </span>
                {/* Rawatib dots */}
                {(hasBefore || hasAfter) && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasBefore && (
                      <span className={cn('h-1.5 w-1.5 rounded-full', beforeDone ? 'bg-primary' : 'bg-border')} />
                    )}
                    {hasAfter && (
                      <span className={cn('h-1.5 w-1.5 rounded-full', afterDone ? 'bg-primary' : 'bg-border')} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion stat */}
        <p className="text-xs text-muted-foreground text-center">
          {completedCount}/5 {i18n.language === 'ar' ? 'مكتملة' : 'completed'}
        </p>
      </CardContent>
    </Card>
  );
}
