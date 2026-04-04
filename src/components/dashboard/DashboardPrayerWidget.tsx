import { useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, House, Building, ChevronRight, Clock, Timer, CheckLine, ClockAlert, XLineTop } from 'lucide-react';

const ICON_STROKE = 1.5;
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { usePrayerTimes, PRAYER_NAMES } from '@/hooks/spiritual/usePrayerTimes';
import { ISLAMIC_EVENTS, isWhiteDay, isSunnahFastingDay } from '@/hooks/spiritual/useHijriCalendar';
import { usePrayerLogs } from '@/hooks/spiritual/usePrayerLogs';
import { usePrayerCountdown } from '@/hooks/spiritual/usePrayerCountdown';
import { useWitrCountdown } from '@/hooks/spiritual/useWitrCountdown';
import { useSunnahLogs } from '@/hooks/spiritual/useSunnahLogs';
import { cn } from '@/lib/utils';
import { cardVariants } from "@/theme/tokens";

const ALL_PRAYERS = ['Fajr', 'Duha', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'] as const;

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
    <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[hsl(var(--prayer-countdown))]/10 text-[hsl(var(--prayer-countdown))] border border-[hsl(var(--prayer-countdown))]/30 shrink-0">
      <Timer className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
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
  const witrCountdown = useWitrCountdown(prayerData?.timings?.Fajr);

  const timings = prayerData?.timings;
  const hijri = prayerData?.date?.hijri;

  // Helper: parse time string to Date
  const parseTime = (timeStr: string | undefined) => {
    if (!timeStr) return null;
    const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
    const [h, m] = clean.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const isDuhaCompleted = todayCompleted.has('duha');

  // Determine active prayer (first unlogged whose time has passed, or next upcoming)
  const activePrayer = useMemo(() => {
    if (!timings) return null;
    const now = new Date();

    // Check Fajr first
    if (!todayLogs['Fajr']) {
      const fajrDate = parseTime(timings.Fajr);
      if (fajrDate && now >= fajrDate) return 'Fajr' as const;
    }

    // Check Duha: active between Sunrise and Dhuhr, if not completed
    if (!isDuhaCompleted) {
      const sunriseDate = parseTime(timings.Sunrise);
      const dhuhrDate = parseTime(timings.Dhuhr);
      if (sunriseDate && dhuhrDate && now >= sunriseDate && now < dhuhrDate) return 'Duha' as const;
    }

    // Check remaining obligatory prayers
    for (const name of PRAYER_NAMES) {
      if (name === 'Fajr') continue; // already checked
      if (todayLogs[name]) continue;
      const pDate = parseTime(timings[name]);
      if (pDate && now >= pDate) return name;
    }

    // Check Witr (active when 22:00+ or before Fajr and not logged)
    if (!todayLogs['Witr'] && witrCountdown.isPrayerTime) {
      return 'Witr' as const;
    }

    // Find next upcoming unlogged obligatory prayer
    for (const name of PRAYER_NAMES) {
      if (todayLogs[name]) continue;
      return name;
    }

    // Check Duha if still before Dhuhr and not completed
    if (!isDuhaCompleted) {
      const dhuhrDate = parseTime(timings.Dhuhr);
      if (dhuhrDate && new Date() < dhuhrDate) return 'Duha' as const;
    }

    // Check if Witr is still pending (before its window)
    if (!todayLogs['Witr'] && !witrCountdown.isExpired) {
      return 'Witr' as const;
    }

    return null;
  }, [timings, todayLogs, isDuhaCompleted, witrCountdown.isPrayerTime, witrCountdown.isExpired]);

  const allCompleted = ALL_PRAYERS.every(n => n === 'Duha' ? isDuhaCompleted : todayLogs[n]?.status?.startsWith('completed'));

  // ── Auto-miss logic (skip Duha — voluntary) ──
  const activePrayerTime = activePrayer && activePrayer !== 'Witr' && activePrayer !== 'Duha' && timings
    ? timings[activePrayer as keyof typeof timings]
    : undefined;
  const countdown = usePrayerCountdown(activePrayerTime);
  const autoMissedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activePrayer || activePrayer === 'Witr' || activePrayer === 'Duha') return;
    if (!countdown.isExpired) return;
    if (todayLogs[activePrayer]) return;
    if (autoMissedRef.current === activePrayer) return;

    autoMissedRef.current = activePrayer;
    const today = new Date().toISOString().split('T')[0];
    logPrayer.mutate({ prayer_name: activePrayer, prayer_date: today, status: 'missed' });
  }, [activePrayer, countdown.isExpired, todayLogs, logPrayer]);

  // Witr auto-miss
  const witrAutoMissedRef = useRef(false);
  useEffect(() => {
    if (activePrayer !== 'Witr') return;
    if (!witrCountdown.isExpired) return;
    if (todayLogs['Witr']) return;
    if (witrAutoMissedRef.current) return;

    witrAutoMissedRef.current = true;
    const today = new Date().toISOString().split('T')[0];
    logPrayer.mutate({ prayer_name: 'Witr', prayer_date: today, status: 'missed' });
  }, [activePrayer, witrCountdown.isExpired, todayLogs, logPrayer]);

  if (!isPrayerEnabled || !timings) return null;

  const today = new Date().toISOString().split('T')[0];
  const completedCount = ALL_PRAYERS.filter(n => todayLogs[n] && todayLogs[n].status?.startsWith('completed')).length;

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
    <Card className={cn(cardVariants.premiumVip, "border-[hsl(var(--islamic-accent))]/[0.49]")}>
      <CardContent className="p-5 space-y-4 border-primary">
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

        {/* Islamic event banner + fasting badges */}
        {(() => {
          if (!hijri) return null;
          const hijriDay = parseInt(hijri.day, 10);
          const eventKey = `${hijri.month.number}-${hijriDay}`;
          const event = ISLAMIC_EVENTS[eventKey];
          const whiteDay = isWhiteDay(hijriDay);
          const sunnahDay = isSunnahFastingDay(new Date());
          const isRamadan = hijri.month.number === 9;
          const hasFasting = whiteDay || sunnahDay || event?.isFastingDay || isRamadan;
          const isAr = i18n.language === 'ar';

          if (!event && !hasFasting) return null;

          return (
            <div className="space-y-1.5">
              {event && (
                <div className="rounded-lg bg-primary/[0.04] px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">{isAr ? event.ar : event.en}</p>
                    {(isAr ? event.descAr : event.descEn) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? event.descAr : event.descEn}</p>
                    )}
                  </div>
                  <Link to="/spiritual/calendar" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0 ms-2">
                    {isAr ? 'التقويم' : 'Calendar'} →
                  </Link>
                </div>
              )}
              {hasFasting && (
                <div className="flex flex-wrap gap-1.5">
                  {isRamadan && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/[0.06] text-foreground/70 font-medium">
                      🌙 {isAr ? 'رمضان' : 'Ramadan'}
                    </span>
                  )}
                  {event?.isFastingDay && !isRamadan && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/[0.06] text-foreground/70 font-medium">
                      🍽️ {isAr ? 'يوم صيام' : 'Fasting Day'}
                    </span>
                  )}
                  {whiteDay && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground font-medium border border-border bg-transparent">
                      🤍 {isAr ? 'الأيام البيض' : 'White Day'}
                    </span>
                  )}
                  {sunnahDay && !isRamadan && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium">
                      📿 {isAr ? (new Date().getDay() === 1 ? 'الاثنين' : 'الخميس') : (new Date().getDay() === 1 ? 'Monday' : 'Thursday')}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Active prayer card */}
        {activePrayer && !allCompleted ? (
          <div className="space-y-2.5 border-t border-border/50 pt-3">
            {/* Row 1: Name + time + countdown + action buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">
                    {t(`spiritual.prayer.names.${activePrayer.toLowerCase()}`)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" strokeWidth={ICON_STROKE} />
                    {activePrayer === 'Duha'
                      ? `${(timings.Sunrise || '').replace(/\s*\(.*\)/, '').trim()} – ${(timings.Dhuhr || '').replace(/\s*\(.*\)/, '').trim()}`
                      : activePrayer === 'Witr'
                        ? t('spiritual.prayer.witrTimeRange', { fajr: (timings.Fajr || '').replace(/\s*\(.*\)/, '').trim() || '--:--' })
                        : (timings[activePrayer as keyof typeof timings] || '').replace(/\s*\(.*\)/, '').trim()
                    }
                  </p>
                </div>
                {/* Countdown badge inline */}
                {activePrayer === 'Duha' ? (() => {
                  const dhuhrDate = parseTime(timings.Dhuhr);
                  if (!dhuhrDate) return null;
                  const minsLeft = Math.ceil((dhuhrDate.getTime() - Date.now()) / 60000);
                  if (minsLeft <= 0) return null;
                  return (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[hsl(var(--prayer-countdown))]/10 text-[hsl(var(--prayer-countdown))] border border-[hsl(var(--prayer-countdown))]/30 shrink-0">
                      <Timer className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
                      {i18n.language === 'ar' ? `${minsLeft}د` : `${minsLeft}m`}
                    </span>
                  );
                })() : activePrayer === 'Witr' ? (
                  witrCountdown.isPrayerTime && !witrCountdown.isExpired && witrCountdown.minutesLeft != null ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[hsl(var(--prayer-countdown))]/10 text-[hsl(var(--prayer-countdown))] border border-[hsl(var(--prayer-countdown))]/30 shrink-0">
                      <Timer className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
                      {i18n.language === 'ar' ? `${witrCountdown.minutesLeft}د` : `${witrCountdown.minutesLeft}m`}
                    </span>
                  ) : null
                ) : (
                  <PrayerCountdownBadge prayerTime={timings[activePrayer as keyof typeof timings]} />
                )}
              </div>
              {/* Action buttons: Duha gets Done toggle, others get location buttons */}
              {activePrayer === 'Duha' ? (
                <Button
                  size="sm"
                  variant={isDuhaCompleted ? 'default' : 'ghost'}
                  onClick={() => togglePractice.mutate({ practice_type: 'duha', completed: !isDuhaCompleted })}
                  disabled={togglePractice.isPending}
                  className={cn('gap-1 h-6 px-2 text-[10px] border', isDuhaCompleted ? 'border-primary/40' : 'border-border/50 hover:border-primary/30')}
                >
                  {isDuhaCompleted ? <Check className="h-3 w-3" strokeWidth={ICON_STROKE} /> : null}
                  {isDuhaCompleted ? (i18n.language === 'ar' ? 'تم ✓' : 'Done ✓') : (i18n.language === 'ar' ? 'تم' : 'Done')}
                </Button>
              ) : (
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleLog('completed_mosque')} disabled={logPrayer.isPending} className="gap-0.5 h-6 px-1.5 text-[10px] border border-border/50 hover:border-primary/30">
                    <Landmark className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.mosque')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleLog('completed_home')} disabled={logPrayer.isPending} className="gap-0.5 h-6 px-1.5 text-[10px] border border-border/50 hover:border-primary/30">
                    <House className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.home')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleLog('completed_work')} disabled={logPrayer.isPending} className="gap-0.5 h-6 px-1.5 text-[10px] border border-border/50 hover:border-primary/30">
                    <Building className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.work')}
                  </Button>
                </div>
              )}
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
                    {todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_before`) && <Check className="h-3 w-3" strokeWidth={ICON_STROKE} />}
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
                    {todayCompleted.has(`rawatib_${activePrayer.toLowerCase()}_after`) && <Check className="h-3 w-3" strokeWidth={ICON_STROKE} />}
                    <span>{i18n.language === 'ar' ? `${activeRawatib.after} ركعات بعد` : `${activeRawatib.after} Rak'ahs after`}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-chart-1/10 via-primary/5 to-chart-1/10 border border-chart-1/20 p-4 space-y-2.5">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🎉</span>
              <p className="text-base font-bold text-chart-1 text-center">
                {i18n.language === 'ar' ? 'ما شاء الله! أكملت جميع الصلوات' : 'Masha\'Allah! All prayers completed!'}
              </p>
              <span className="text-3xl">🎉</span>
            </div>
            <div className="rounded-xl bg-muted/5 border border-border/30 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-primary text-center">📖 {i18n.language === 'ar' ? 'حديث شريف' : 'Hadith'}</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic font-light text-left">
                {i18n.language === 'ar'
                  ? '«أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ مِنْهُ كُلَّ يَوْمٍ خَمْسَ مَرَّاتٍ، هَلْ يَبْقَى مِنْ دَرَنِهِ شَيْءٌ؟» قَالُوا: لاَ يَبْقَى مِنْ دَرَنِهِ شَيْءٌ. قَالَ: «فَذَلِكَ مَثَلُ الصَّلَوَاتِ الْخَمْسِ، يَمْحُو اللَّهُ بِهِنَّ الْخَطَايَا»'
                  : '"If there was a river at the door of anyone of you and he took a bath in it five times a day, would any dirt remain on him?" They said, "No." He ﷺ said, "That is the example of the five prayers with which Allah erases sins."'}
              </p>
              <p className="text-2xs text-muted-foreground/70">
                {i18n.language === 'ar' ? '— متفق عليه' : '— Agreed upon (Bukhari & Muslim)'}
              </p>
            </div>
          </div>
        )}

        {/* Progress row — 7 prayer indicators (5 obligatory + Duha + Witr) */}
        <div className="flex items-center justify-between gap-0.5">
        {ALL_PRAYERS.map(name => {
            const isDuha = name === 'Duha';
            const logEntry = !isDuha ? todayLogs[name] : null;
            const logged = isDuha ? isDuhaCompleted : !!logEntry;
            const isMissed = !isDuha && logEntry?.status === 'missed';
            const isMosque = !isDuha && logEntry?.status === 'completed_mosque';
            const isActive = name === activePrayer;
            const rawatib = RAWATIB_CONFIG[name];
            const hasBefore = !!rawatib?.before;
            const hasAfter = !!rawatib?.after;
            const beforeDone = todayCompleted.has(`rawatib_${name.toLowerCase()}_before`);
            const afterDone = todayCompleted.has(`rawatib_${name.toLowerCase()}_after`);
             return (
              <div key={name} className="flex flex-col items-center gap-0.5 flex-1 min-h-[3.5rem]">
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs border transition-all',
                    logged && !isMissed && 'bg-[hsl(var(--state-completed))]/20 border-[hsl(var(--state-completed))]/40 text-[hsl(var(--state-completed))]',
                    isMissed && 'bg-destructive/10 border-destructive/30 text-destructive',
                    !logged && isActive && 'bg-primary/10 border-primary/40 text-primary ring-2 ring-primary/20 animate-pulse',
                    !logged && !isActive && 'bg-muted border-border text-muted-foreground',
                  )}
                >
                  {logged && !isMissed ? (
                    isDuha ? <span className="text-[10px]">☀</span>
                    : isMosque ? <Check className="h-3 w-3" strokeWidth={ICON_STROKE} />
                    : <ClockAlert className="h-3 w-3" strokeWidth={ICON_STROKE} />
                  ) : null}
                  {isMissed ? <XOctagon className="h-3 w-3" strokeWidth={ICON_STROKE} /> : null}
                  {!logged && isActive ? <Timer className="h-3 w-3" strokeWidth={ICON_STROKE} /> : null}
                  {!logged && !isActive && isDuha ? <span className="text-[10px]">☀</span> : null}
                </div>
                <span className="text-[9px] font-medium text-foreground leading-none">
                  {t(`spiritual.prayer.names.${name.toLowerCase()}`)}
                </span>
                <span className="text-[8px] text-muted-foreground leading-none">
                  {isDuha ? (timings.Sunrise || '').replace(/\s*\(.*\)/, '').trim()
                    : name === 'Witr' ? '—'
                    : (timings[name as keyof typeof timings] || '').replace(/\s*\(.*\)/, '').trim()}
                </span>
                {/* Rawatib dots */}
                {(hasBefore || hasAfter) ? (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasBefore && (
                      <span className={cn('h-1.5 w-1.5 rounded-full', beforeDone ? 'bg-primary' : 'bg-border')} />
                    )}
                    {hasAfter && (
                      <span className={cn('h-1.5 w-1.5 rounded-full', afterDone ? 'bg-primary' : 'bg-border')} />
                    )}
                  </div>
                ) : (
                  <div className="h-2 mt-0.5" /> 
                )}
              </div>
            );
          })}
        </div>

        {/* Next prayer countdown */}
        {(() => {
          if (!timings) return null;
          const now = new Date();
          for (const name of ALL_PRAYERS) {
            if (name === 'Duha') {
              if (isDuhaCompleted) continue;
              const sunriseDate = parseTime(timings.Sunrise);
              if (sunriseDate && sunriseDate > now) {
                const minsUntil = Math.ceil((sunriseDate.getTime() - now.getTime()) / 60000);
                return (
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {i18n.language === 'ar' 
                        ? `التالي: ${t('spiritual.prayer.names.duha')} بعد ${minsUntil}د`
                        : `Next: ${t('spiritual.prayer.names.duha')} in ${minsUntil >= 60 ? `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m` : `${minsUntil}m`}`
                      }
                    </span>
                  </div>
                );
              }
              continue;
            }
            if (todayLogs[name]) continue;
            if (name === 'Witr') continue;
            const pDate = parseTime(timings[name as keyof typeof timings]);
            if (pDate && pDate > now) {
              const minsUntil = Math.ceil((pDate.getTime() - now.getTime()) / 60000);
              return (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {i18n.language === 'ar' 
                      ? `التالي: ${t(`spiritual.prayer.names.${name.toLowerCase()}`)} بعد ${minsUntil}د`
                      : `Next: ${t(`spiritual.prayer.names.${name.toLowerCase()}`)} in ${minsUntil >= 60 ? `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m` : `${minsUntil}m`}`
                    }
                  </span>
                </div>
              );
            }
          }
          return null;
        })()}
      </CardContent>
    </Card>
  );
}
