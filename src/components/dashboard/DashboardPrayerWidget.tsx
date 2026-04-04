import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, House, Building, ChevronRight, Clock, Timer, Check, X, Pencil, EyeOff, Eye } from 'lucide-react';

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
import { getLocalDateString } from '@/utils/getLocalDate';
import { useAutoRefreshOnDayChange } from '@/hooks/useAutoRefreshOnDayChange';
import { usePrayerTrackerVisibility } from '@/hooks/spiritual/usePrayerTrackerVisibility';

/** Canonical prayer order */
/** Chronological order: Witr (last night) → Fajr → ... → Isha */
const ALL_PRAYERS = ['Witr', 'Fajr', 'Duha', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

const RAWATIB_CONFIG: Record<string, { before?: number; after?: number }> = {
  Fajr:    { before: 2 },
  Dhuhr:   { before: 2, after: 2 },
  Asr:     {},
  Maghrib: { after: 2 },
  Isha:    { after: 2 },
};

/** Parse "HH:mm" (possibly with timezone label) → Date today */
const parseTime = (timeStr: string | undefined) => {
  if (!timeStr) return null;
  const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
  const [h, m] = clean.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

/** Check if a prayer's 60-minute window has expired */
const isWindowExpired = (timeStr: string | undefined): boolean => {
  const pDate = parseTime(timeStr);
  if (!pDate) return false;
  const deadline = new Date(pDate.getTime() + 60 * 60 * 1000);
  return new Date() >= deadline;
};

/** Check if prayer time has started */
const hasPrayerStarted = (timeStr: string | undefined): boolean => {
  const pDate = parseTime(timeStr);
  if (!pDate) return false;
  return new Date() >= pDate;
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
  useAutoRefreshOnDayChange();
  const isAr = i18n.language === 'ar';
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
  const isDuhaCompleted = todayCompleted.has('duha');
  const today = getLocalDateString();

  // State for editing a logged prayer
  const [editingPrayer, setEditingPrayer] = useState<string | null>(null);

  // ─── Find all unlogged prayers that have started (for action buttons) ───
  const unloggedPrayers = useMemo(() => {
    if (!timings) return [];
    const result: string[] = [];
    for (const name of ALL_PRAYERS) {
      if (name === 'Duha') {
        if (!isDuhaCompleted) {
          const sunriseDate = parseTime(timings.Sunrise);
          const dhuhrDate = parseTime(timings.Dhuhr);
          const now = new Date();
          if (sunriseDate && now >= sunriseDate && (!dhuhrDate || now < dhuhrDate)) {
            result.push('Duha');
          }
        }
        continue;
      }
      if (name === 'Witr') {
        if (!todayLogs['Witr'] && witrCountdown.isPrayerTime) {
          result.push('Witr');
        }
        continue;
      }
      if (todayLogs[name]) continue;
      if (hasPrayerStarted(timings[name as keyof typeof timings])) {
        result.push(name);
      }
    }
    return result;
  }, [timings, todayLogs, isDuhaCompleted, witrCountdown.isPrayerTime]);

  // The first unlogged prayer is the "primary active" one
  const activePrayer = unloggedPrayers[0] ?? null;

  // ─── Completion count: only 'completed_*' statuses ───
  const completedCount = ALL_PRAYERS.filter(n => {
    if (n === 'Duha') return isDuhaCompleted;
    const log = todayLogs[n];
    return log?.status?.startsWith('completed');
  }).length;

  const totalPrayers = ALL_PRAYERS.length;
  const progressPercent = Math.round((completedCount / totalPrayers) * 100);
  const allCompleted = completedCount === totalPrayers;

  // ─── Day Done detection: all prayer windows have expired ───
  const isDayDone = useMemo(() => {
    if (!timings) return false;
    const ishaExpired = isWindowExpired(timings.Isha);
    const duhaExpired = (() => {
      const dhuhrDate = parseTime(timings.Dhuhr);
      return dhuhrDate ? new Date() >= dhuhrDate : false;
    })();
    const witrDone = witrCountdown.isExpired || !!todayLogs['Witr'];
    return ishaExpired && duhaExpired && witrDone;
  }, [timings, witrCountdown.isExpired, todayLogs]);

  // NO auto-miss useEffect — prayers are visual-only until user acts

  // ─── Next upcoming prayer ───
  const nextUpcomingPrayer = useMemo(() => {
    if (!timings) return null;
    const now = new Date();
    for (const name of ALL_PRAYERS) {
      if (name === 'Duha') {
        if (isDuhaCompleted) continue;
        const sunriseDate = parseTime(timings.Sunrise);
        if (sunriseDate && sunriseDate > now) {
          return { name, minsUntil: Math.ceil((sunriseDate.getTime() - now.getTime()) / 60000) };
        }
        continue;
      }
      if (name === 'Witr') {
        // Witr: show countdown to Fajr if Witr window is active
        if (!todayLogs['Witr'] && witrCountdown.isPrayerTime && !witrCountdown.isExpired && witrCountdown.minutesLeft != null) {
          return { name: 'Witr', minsUntil: witrCountdown.minutesLeft };
        }
        continue;
      }
      if (todayLogs[name]) continue;
      const pDate = parseTime(timings[name as keyof typeof timings]);
      if (pDate && pDate > now) {
        return { name, minsUntil: Math.ceil((pDate.getTime() - now.getTime()) / 60000) };
      }
    }
    return null;
  }, [timings, todayLogs, isDuhaCompleted]);

  if (!isPrayerEnabled || !timings) return null;

  const handleLog = (prayerName: string, status: string) => {
    logPrayer.mutate({ prayer_name: prayerName, prayer_date: today, status });
    setEditingPrayer(null);
  };

  const handleToggleSunnah = (prayerName: string, type: 'before' | 'after', completed: boolean) => {
    togglePractice.mutate({ practice_type: `rawatib_${prayerName.toLowerCase()}_${type}`, completed });
  };

  const formatMins = (mins: number) => {
    if (isAr) return mins >= 60 ? `${Math.floor(mins / 60)}س ${mins % 60}د` : `${mins}د`;
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  };

  /** Get visual status of a prayer */
  const getPrayerStatus = (name: string): 'completed' | 'missed' | 'active' | 'expired' | 'pending' => {
    if (name === 'Duha') {
      if (isDuhaCompleted) return 'completed';
      const sunriseDate = parseTime(timings.Sunrise);
      const dhuhrDate = parseTime(timings.Dhuhr);
      const now = new Date();
      if (sunriseDate && now >= sunriseDate && (!dhuhrDate || now < dhuhrDate)) return 'active';
      if (dhuhrDate && now >= dhuhrDate && !isDuhaCompleted) return 'expired';
      return 'pending';
    }
    const log = todayLogs[name];
    if (log?.status?.startsWith('completed')) return 'completed';
    if (log?.status === 'missed') return 'missed';

    // No DB log — check time
    if (name === 'Witr') {
      if (witrCountdown.isPrayerTime && !witrCountdown.isExpired) return 'active';
      if (witrCountdown.isExpired) return 'expired';
      return 'pending';
    }

    const timeStr = timings[name as keyof typeof timings];
    if (!hasPrayerStarted(timeStr)) return 'pending';
    if (!isWindowExpired(timeStr)) return 'active';
    return 'expired'; // Past 60 min, no DB log — show red but still interactive
  };

  /** Render action buttons for a prayer */
  const renderActionButtons = (prayerName: string) => {
    if (prayerName === 'Duha') {
      return (
        <Button
          size="sm"
          variant={isDuhaCompleted ? 'default' : 'ghost'}
          onClick={() => togglePractice.mutate({ practice_type: 'duha', completed: !isDuhaCompleted })}
          disabled={togglePractice.isPending}
          className={cn('gap-1 h-6 px-2 text-[10px] border', isDuhaCompleted ? 'border-primary/40' : 'border-border/50 hover:border-primary/30')}
        >
          {isDuhaCompleted && <Check className="h-3 w-3" strokeWidth={ICON_STROKE} />}
          {isDuhaCompleted ? (isAr ? 'تم ✓' : 'Done ✓') : (isAr ? 'تم' : 'Done')}
        </Button>
      );
    }
    return (
      <div className="flex gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={() => handleLog(prayerName, 'completed_mosque')} disabled={logPrayer.isPending} className="gap-0.5 h-6 px-1.5 text-[10px] border border-border/50 hover:border-primary/30">
          <Landmark className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.mosque')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleLog(prayerName, 'completed_home')} disabled={logPrayer.isPending} className="gap-0.5 h-6 px-1.5 text-[10px] border border-border/50 hover:border-primary/30">
          <House className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.home')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleLog(prayerName, 'completed_work')} disabled={logPrayer.isPending} className="gap-0.5 h-6 px-1.5 text-[10px] border border-border/50 hover:border-primary/30">
          <Building className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.work')}
        </Button>
      </div>
    );
  };

  return (
    <Card className={cn(cardVariants.premiumVip, "border-[hsl(var(--islamic-accent))]/[0.49]")}>
      <CardContent className="p-5 space-y-4 border-primary">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕌</span>
            <div>
              <h3 className="font-semibold text-sm">{t('spiritual.prayer.title')}</h3>
              {hijri && (
                <p className="text-xs text-muted-foreground">
                  {isAr ? `${hijri.day} ${hijri.month.ar} ${hijri.year}` : `${hijri.day} ${hijri.month.en} ${hijri.year}`}
                  {prayerData?.date?.readable && (
                    <span className="text-muted-foreground/70"> | {prayerData.date.readable}</span>
                  )}
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

        {/* ── Islamic event banner ── */}
        {(() => {
          if (!hijri) return null;
          const hijriDay = parseInt(hijri.day, 10);
          const eventKey = `${hijri.month.number}-${hijriDay}`;
          const event = ISLAMIC_EVENTS[eventKey];
          const whiteDay = isWhiteDay(hijriDay);
          const sunnahDay = isSunnahFastingDay(new Date());
          const isRamadan = hijri.month.number === 9;
          const hasFasting = whiteDay || sunnahDay || event?.isFastingDay || isRamadan;
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/[0.06] text-foreground/70 font-medium">🌙 {isAr ? 'رمضان' : 'Ramadan'}</span>
                  )}
                  {event?.isFastingDay && !isRamadan && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/[0.06] text-foreground/70 font-medium">🍽️ {isAr ? 'يوم صيام' : 'Fasting Day'}</span>
                  )}
                  {whiteDay && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground font-medium border border-border bg-transparent">🤍 {isAr ? 'الأيام البيض' : 'White Day'}</span>
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

        {/* ── Active / Unlogged prayer cards with action buttons ── */}
        {allCompleted ? (
          <div className="rounded-xl bg-gradient-to-br from-chart-1/10 via-primary/5 to-chart-1/10 border border-chart-1/20 p-4 space-y-2.5">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🎉</span>
              <p className="text-base font-bold text-chart-1 text-center">
                {isAr ? 'ما شاء الله! أكملت جميع الصلوات' : "Masha'Allah! All prayers completed!"}
              </p>
              <span className="text-3xl">🎉</span>
            </div>
            <div className="rounded-xl bg-muted/5 border border-border/30 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-primary text-center">📖 {isAr ? 'حديث شريف' : 'Hadith'}</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic font-light text-start">
                {isAr
                  ? '«أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ مِنْهُ كُلَّ يَوْمٍ خَمْسَ مَرَّاتٍ، هَلْ يَبْقَى مِنْ دَرَنِهِ شَيْءٌ؟» قَالُوا: لاَ يَبْقَى مِنْ دَرَنِهِ شَيْءٌ. قَالَ: «فَذَلِكَ مَثَلُ الصَّلَوَاتِ الْخَمْسِ، يَمْحُو اللَّهُ بِهِنَّ الْخَطَايَا»'
                  : '"If there was a river at the door of anyone of you and he took a bath in it five times a day, would any dirt remain on him?" They said, "No." He ﷺ said, "That is the example of the five prayers with which Allah erases sins."'}
              </p>
              <p className="text-2xs text-muted-foreground/70">{isAr ? '— متفق عليه' : '— Agreed upon (Bukhari & Muslim)'}</p>
            </div>
            <Link to="/spiritual/prayer" className="block">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8 border-border/60">
                {isAr ? 'عرض التفاصيل' : 'View Details'}
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        ) : isDayDone ? (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {isAr ? 'انتهى يوم الصلاة' : 'Prayer Day Complete'}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {completedCount}/{totalPrayers}
              </p>
              <p className="text-xs text-muted-foreground">
                {completedCount === 0
                  ? (isAr ? 'غدًا يوم جديد إن شاء الله' : 'Tomorrow is a new day, In Shaa Allah')
                  : completedCount <= 3
                    ? (isAr ? 'حاول أن تحافظ على المزيد غدًا' : 'Try to keep more tomorrow')
                    : completedCount <= 5
                      ? (isAr ? 'جهد طيب، واصل!' : 'Good effort, keep going!')
                      : (isAr ? 'ما شاء الله، أداء ممتاز!' : "Masha'Allah, excellent!")}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-[hsl(var(--state-completed))]">
                <Check className="h-3 w-3" strokeWidth={2} /> {completedCount} {isAr ? 'مكتملة' : 'completed'}
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <X className="h-3 w-3" strokeWidth={2} /> {totalPrayers - completedCount} {isAr ? 'فائتة' : 'missed'}
              </span>
            </div>
            <Link to="/spiritual/prayer" className="block">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8 border-border/60">
                {isAr ? 'عرض التفاصيل' : 'View Details'}
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        ) : unloggedPrayers.length > 0 ? (
          <div className="space-y-2 border-t border-border/50 pt-3">
            {unloggedPrayers.map((prayerName) => {
              const isExpanded = prayerName === activePrayer;
              return (
                <div key={prayerName} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight">
                          {t(`spiritual.prayer.names.${prayerName.toLowerCase()}`)}
                          {isWindowExpired(timings[prayerName as keyof typeof timings]) && prayerName !== 'Duha' && prayerName !== 'Witr' && (
                            <span className="text-[10px] text-destructive/70 font-normal ms-1.5">
                              {isAr ? '(فات الوقت)' : '(late)'}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" strokeWidth={ICON_STROKE} />
                          {prayerName === 'Duha'
                            ? `${(timings.Sunrise || '').replace(/\s*\(.*\)/, '').trim()} – ${(timings.Dhuhr || '').replace(/\s*\(.*\)/, '').trim()}`
                            : prayerName === 'Witr'
                              ? t('spiritual.prayer.witrTimeRange', { fajr: (timings.Fajr || '').replace(/\s*\(.*\)/, '').trim() || '--:--' })
                              : (timings[prayerName as keyof typeof timings] || '').replace(/\s*\(.*\)/, '').trim()
                          }
                        </p>
                      </div>
                      {prayerName === 'Duha' ? (() => {
                        const dhuhrDate = parseTime(timings.Dhuhr);
                        if (!dhuhrDate) return null;
                        const minsLeft = Math.ceil((dhuhrDate.getTime() - Date.now()) / 60000);
                        if (minsLeft <= 0) return null;
                        return (
                          <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[hsl(var(--prayer-countdown))]/10 text-[hsl(var(--prayer-countdown))] border border-[hsl(var(--prayer-countdown))]/30 shrink-0">
                            <Timer className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
                            {isAr ? `${minsLeft}د` : `${minsLeft}m`}
                          </span>
                        );
                      })() : prayerName === 'Witr' ? (
                        witrCountdown.isPrayerTime && !witrCountdown.isExpired && witrCountdown.minutesLeft != null ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[hsl(var(--prayer-countdown))]/10 text-[hsl(var(--prayer-countdown))] border border-[hsl(var(--prayer-countdown))]/30 shrink-0">
                            <Timer className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
                            {isAr ? `${witrCountdown.minutesLeft}د` : `${witrCountdown.minutesLeft}m`}
                          </span>
                        ) : null
                      ) : !isWindowExpired(timings[prayerName as keyof typeof timings]) ? (
                        <PrayerCountdownBadge prayerTime={timings[prayerName as keyof typeof timings]} />
                      ) : null}
                    </div>
                    {renderActionButtons(prayerName)}
                  </div>

                  {isExpanded && (() => {
                    const rawatib = RAWATIB_CONFIG[prayerName];
                    if (!rawatib || (!rawatib.before && !rawatib.after)) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {rawatib.before && (
                          <button
                            onClick={() => handleToggleSunnah(prayerName, 'before', !todayCompleted.has(`rawatib_${prayerName.toLowerCase()}_before`))}
                            disabled={togglePractice.isPending}
                            className={cn(
                              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-all duration-200',
                              todayCompleted.has(`rawatib_${prayerName.toLowerCase()}_before`)
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                            )}
                          >
                            📿
                            {todayCompleted.has(`rawatib_${prayerName.toLowerCase()}_before`) && <Check className="h-3 w-3" strokeWidth={ICON_STROKE} />}
                            <span>{isAr ? `${rawatib.before} ركعات قبل` : `${rawatib.before} Rak'ahs before`}</span>
                          </button>
                        )}
                        {rawatib.after && (
                          <button
                            onClick={() => handleToggleSunnah(prayerName, 'after', !todayCompleted.has(`rawatib_${prayerName.toLowerCase()}_after`))}
                            disabled={togglePractice.isPending}
                            className={cn(
                              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-all duration-200',
                              todayCompleted.has(`rawatib_${prayerName.toLowerCase()}_after`)
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                            )}
                          >
                            📿
                            {todayCompleted.has(`rawatib_${prayerName.toLowerCase()}_after`) && <Check className="h-3 w-3" strokeWidth={ICON_STROKE} />}
                            <span>{isAr ? `${rawatib.after} ركعات بعد` : `${rawatib.after} Rak'ahs after`}</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        ) : nextUpcomingPrayer ? (
          <div className="border-t border-border/50 pt-3">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <span className="text-xs text-muted-foreground font-medium">
                {isAr
                  ? `التالي: ${t(`spiritual.prayer.names.${nextUpcomingPrayer.name.toLowerCase()}`)} بعد ${formatMins(nextUpcomingPrayer.minsUntil)}`
                  : `Next: ${t(`spiritual.prayer.names.${nextUpcomingPrayer.name.toLowerCase()}`)} in ${formatMins(nextUpcomingPrayer.minsUntil)}`
                }
              </span>
            </div>
          </div>
        ) : null}

        {/* ── Progress row — 7 prayer indicators ── */}
        <div className="flex items-center justify-between gap-0.5">
          {ALL_PRAYERS.map(name => {
            const isDuha = name === 'Duha';
            const status = getPrayerStatus(name);
            const isCompleted = status === 'completed';
            const isMissed = status === 'missed';
            const isExpired = status === 'expired';
            const isActive = status === 'active';
            const isEditing = editingPrayer === name;
            const rawatib = RAWATIB_CONFIG[name];
            const hasBefore = !!rawatib?.before;
            const hasAfter = !!rawatib?.after;
            const beforeDone = todayCompleted.has(`rawatib_${name.toLowerCase()}_before`);
            const afterDone = todayCompleted.has(`rawatib_${name.toLowerCase()}_after`);

            const canEdit = (isCompleted || isMissed) && name !== 'Duha';

            return (
              <div key={name} className="flex flex-col items-center gap-0.5 flex-1 min-h-[3.5rem] relative">
                {/* Circle indicator — tappable for edit */}
                <button
                  onClick={() => canEdit ? setEditingPrayer(isEditing ? null : name) : undefined}
                  disabled={!canEdit}
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center border transition-all',
                    isCompleted && 'bg-[hsl(var(--state-completed))]/20 border-[hsl(var(--state-completed))]/40 text-[hsl(var(--state-completed))]',
                    (isMissed || isExpired) && 'bg-destructive/10 border-destructive/30 text-destructive',
                    isActive && 'bg-primary/10 border-primary/40 text-primary ring-2 ring-primary/20 animate-pulse',
                    !isCompleted && !isMissed && !isExpired && !isActive && 'bg-muted border-border text-muted-foreground',
                    canEdit && 'cursor-pointer hover:ring-2 hover:ring-primary/20',
                  )}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                  {(isMissed || isExpired) && <X className="h-3.5 w-3.5" strokeWidth={2} />}
                  {isActive && <Timer className="h-3 w-3" strokeWidth={ICON_STROKE} />}
                </button>

                {/* Edit popover */}
                {isEditing && (
                  <div className="absolute top-8 z-50 bg-card border border-border rounded-lg shadow-lg p-2 space-y-1 min-w-[120px]">
                    <button onClick={() => handleLog(name, 'completed_mosque')} className="flex items-center gap-1.5 w-full px-2 py-1 text-[10px] rounded hover:bg-muted transition-colors">
                      <Landmark className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.mosque')}
                    </button>
                    <button onClick={() => handleLog(name, 'completed_home')} className="flex items-center gap-1.5 w-full px-2 py-1 text-[10px] rounded hover:bg-muted transition-colors">
                      <House className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.home')}
                    </button>
                    <button onClick={() => handleLog(name, 'completed_work')} className="flex items-center gap-1.5 w-full px-2 py-1 text-[10px] rounded hover:bg-muted transition-colors">
                      <Building className="h-3 w-3" strokeWidth={ICON_STROKE} /> {t('spiritual.prayer.work')}
                    </button>
                    <button onClick={() => handleLog(name, 'missed')} className="flex items-center gap-1.5 w-full px-2 py-1 text-[10px] rounded hover:bg-destructive/10 text-destructive transition-colors">
                      <X className="h-3 w-3" strokeWidth={ICON_STROKE} /> {isAr ? 'فائتة' : 'Missed'}
                    </button>
                  </div>
                )}

                {/* Prayer name */}
                <span className="text-[9px] font-medium text-foreground leading-none">
                  {t(`spiritual.prayer.names.${name.toLowerCase()}`, { defaultValue: name })}
                </span>

                {/* Duha underline indicator */}
                {isDuha && (
                  <div className="h-[2px] w-3 rounded-full bg-primary/40 mt-px" />
                )}

                {/* Time */}
                {!isDuha && (
                  <span className="text-[8px] text-muted-foreground leading-none">
                    {name === 'Witr' ? '—' : (timings[name as keyof typeof timings] || '').replace(/\s*\(.*\)/, '').trim()}
                  </span>
                )}

                {/* Rawatib dots */}
                {(hasBefore || hasAfter) ? (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasBefore && <span className={cn('h-1.5 w-1.5 rounded-full', beforeDone ? 'bg-primary' : 'bg-border')} />}
                    {hasAfter && <span className={cn('h-1.5 w-1.5 rounded-full', afterDone ? 'bg-primary' : 'bg-border')} />}
                  </div>
                ) : (
                  <div className="h-2 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>


        {/* Next prayer info when active prayers exist */}
        {unloggedPrayers.length > 0 && !allCompleted && nextUpcomingPrayer && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground font-medium">
              {isAr
                ? `التالي: ${t(`spiritual.prayer.names.${nextUpcomingPrayer.name.toLowerCase()}`)} بعد ${formatMins(nextUpcomingPrayer.minsUntil)}`
                : `Next: ${t(`spiritual.prayer.names.${nextUpcomingPrayer.name.toLowerCase()}`)} in ${formatMins(nextUpcomingPrayer.minsUntil)}`
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
