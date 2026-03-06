import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, UtensilsCrossed, CalendarDays, CalendarRange } from 'lucide-react';
import { useHijriCalendar, useHijriToday, ISLAMIC_EVENTS, isWhiteDay, isSunnahFastingDay } from '@/hooks/spiritual/useHijriCalendar';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useNavigate } from 'react-router-dom';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type CalendarView = 'month' | 'week';

export default function IslamicCalendar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { isEnabled, isPending: prefsLoading } = useSpiritualPreferences();

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  const { data: calendarDays, isLoading: calLoading, error: calError } = useHijriCalendar(viewMonth, viewYear);
  const { data: hijriToday } = useHijriToday();

  const todayStr = now.toISOString().split('T')[0];

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Build full month calendar grid
  const calendarGrid = useMemo(() => {
    if (!calendarDays?.length) return [];
    const firstDayOfWeek = new Date(calendarDays[0].gregorian).getDay();
    const grid: (typeof calendarDays[0] | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    calendarDays.forEach(d => grid.push(d));
    return grid;
  }, [calendarDays]);

  // Week view
  const weekGrid = useMemo(() => {
    if (!calendarDays?.length) return [];
    const todayIndex = calendarDays.findIndex(d => d.gregorian === todayStr);
    const centerIndex = todayIndex >= 0 ? todayIndex : 0;
    const centerDate = new Date(calendarDays[centerIndex].gregorian);
    const dayOfWeek = centerDate.getDay();
    const weekStartIndex = centerIndex - dayOfWeek;
    const week: (typeof calendarDays[0] | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const idx = weekStartIndex + i;
      if (idx >= 0 && idx < calendarDays.length) week.push(calendarDays[idx]);
      else week.push(null);
    }
    return week;
  }, [calendarDays, todayStr]);

  const displayGrid = calendarView === 'week' ? weekGrid : calendarGrid;

  // Enrich days with event/fasting info
  const enrichedDays = useMemo(() => {
    if (!calendarDays?.length) return [];
    return calendarDays.map(day => {
      const hijriDay = parseInt(day.hijri.day);
      const hijriMonth = day.hijri.month.number;
      const hijriKey = `${hijriMonth}-${hijriDay}`;
      const event = ISLAMIC_EVENTS[hijriKey];
      const white = isWhiteDay(hijriDay);
      const gregDate = new Date(day.gregorian);
      const sunnah = isSunnahFastingDay(gregDate);
      const isRamadan = hijriMonth === 9;
      return { ...day, event, isWhiteDay: white, isSunnahDay: sunnah, isRamadan };
    });
  }, [calendarDays]);

  // Deduplicated Islamic events: prefer local ISLAMIC_EVENTS, skip API duplicates
  const islamicEvents = useMemo(() => {
    return enrichedDays.filter(d => {
      // Has a local event match — always include
      if (d.event) return true;
      // Has API holidays but NO local match — include only if not a duplicate
      if (d.hijri.holidays?.length > 0 && !d.event) return true;
      return false;
    });
  }, [enrichedDays]);

  // Fasting days: group sunnah days, show special ones individually
  const fastingData = useMemo(() => {
    const specialFasting: typeof enrichedDays = [];
    let sunnahMondays = 0;
    let sunnahThursdays = 0;
    let whiteDayCount = 0;
    let ramadanCount = 0;

    enrichedDays.forEach(d => {
      if (d.isRamadan) {
        ramadanCount++;
        return;
      }
      if (d.event?.isFastingDay) {
        specialFasting.push(d);
        return;
      }
      if (d.isWhiteDay) { whiteDayCount++; return; }
      if (d.isSunnahDay) {
        const dow = new Date(d.gregorian).getDay();
        if (dow === 1) sunnahMondays++;
        if (dow === 4) sunnahThursdays++;
      }
    });

    return { specialFasting, sunnahMondays, sunnahThursdays, whiteDayCount, ramadanCount };
  }, [enrichedDays]);

  if (prefsLoading) return <div className="container mx-auto py-6"><Skeleton className="h-64" /></div>;

  if (!isEnabled) {
    return (
      <div className="container mx-auto py-6">
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="p-12 text-center space-y-4">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.calendar.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.calendar.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weekdays = isRTL ? WEEKDAYS_AR : WEEKDAYS_EN;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Hijri today */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('spiritual.calendar.title')}</h1>
            {hijriToday && (
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? `${hijriToday.day} ${hijriToday.month.ar} ${hijriToday.year} هـ`
                  : `${hijriToday.day} ${hijriToday.month.en} ${hijriToday.year} AH`}
              </p>
            )}
          </div>
        </div>
        <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as CalendarView)}>
          <TabsList>
            <TabsTrigger value="week" className="gap-1.5">
              <CalendarRange className="h-4 w-4" />
              {t('spiritual.calendar.weekView', 'Week')}
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {t('spiritual.calendar.monthView', 'Month')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Month navigation */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
            <CardTitle className="text-lg">{MONTHS_EN[viewMonth]} {viewYear}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calLoading ? (
            <Skeleton className="h-64" />
          ) : calError ? (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm font-medium">{t('spiritual.calendar.fetchError', 'Failed to load calendar data. Please try again.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {weekdays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {displayGrid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className={calendarView === 'week' ? 'min-h-[5rem]' : ''} />;
                const isToday = day.gregorian === todayStr;
                const hijriDay = parseInt(day.hijri.day);
                const hijriKey = `${day.hijri.month.number}-${hijriDay}`;
                const event = ISLAMIC_EVENTS[hijriKey];
                const white = isWhiteDay(hijriDay);
                const sunnah = isSunnahFastingDay(new Date(day.gregorian));
                const hasHoliday = !event && day.hijri.holidays?.length > 0;
                const cellHeight = calendarView === 'week' ? 'min-h-[5rem]' : 'min-h-[3.5rem]';

                return (
                  <div
                    key={day.gregorian}
                    className={`relative p-1.5 rounded-md text-center ${cellHeight} border transition-colors ${
                      isToday ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-transparent'
                    } ${event || hasHoliday ? 'bg-accent/40' : ''} ${white || sunnah ? 'bg-chart-2/10' : ''}`}
                  >
                    <div className="text-sm font-medium">{new Date(day.gregorian).getDate()}</div>
                    <div className="text-2xs text-muted-foreground">{day.hijri.day}</div>
                    <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                      {(event || hasHoliday) && <Star className="h-3 w-3 text-chart-4 fill-chart-4" />}
                      {(white || sunnah || event?.isFastingDay || day.hijri.month.number === 9) && (
                        <UtensilsCrossed className="h-3 w-3 text-chart-2" />
                      )}
                    </div>
                    {calendarView === 'week' && (event || hasHoliday) && (
                      <p className="text-2xs text-chart-4 font-medium mt-0.5 leading-tight truncate">
                        {event ? (isRTL ? event.ar : event.en) : day.hijri.holidays?.[0]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Islamic Events this month — deduplicated with descriptions */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-chart-4" />
            {t('spiritual.calendar.upcomingEvents', 'Islamic Events This Month')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {islamicEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('spiritual.calendar.noEvents', 'No Islamic events this month')}</p>
          ) : (
            islamicEvents.map(day => {
              const label = day.event
                ? (isRTL ? day.event.ar : day.event.en)
                : day.hijri.holidays?.[0] || '';
              const desc = day.event
                ? (isRTL ? day.event.descAr : day.event.descEn)
                : undefined;

              return (
                <div key={`event-${day.gregorian}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[3rem] bg-accent/30 rounded-lg p-1.5">
                      <div className="text-sm font-bold">{new Date(day.gregorian).getDate()}</div>
                       <div className="text-2xs text-muted-foreground">
                        {isRTL ? day.hijri.month.ar : day.hijri.month.en} {day.hijri.day}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      {desc && <p className="text-xs text-muted-foreground leading-tight">{desc}</p>}
                    </div>
                  </div>
                  {day.event?.isFastingDay && (
                    <Badge variant="secondary" className="text-xs">
                      <UtensilsCrossed className="h-3 w-3 me-1" />
                      {t('spiritual.calendar.fastingDay', 'Fasting Day')}
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Recommended Fasting Days — grouped */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-chart-2" />
            {t('spiritual.calendar.recommendedFasting', 'Recommended Fasting Days')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fastingData.ramadanCount === 0 && fastingData.specialFasting.length === 0 && fastingData.whiteDayCount === 0 && fastingData.sunnahMondays === 0 && fastingData.sunnahThursdays === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('spiritual.calendar.noFastingDays', 'No recommended fasting days this month')}
            </p>
          ) : (
            <>
              {/* Ramadan summary */}
              {fastingData.ramadanCount > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-chart-2/30 bg-chart-2/10">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="h-4 w-4 text-chart-2" />
                    <div>
                      <p className="text-sm font-medium">{isRTL ? 'صيام رمضان (فرض)' : 'Ramadan Fasting (Obligatory)'}</p>
                       <p className="text-xs text-muted-foreground">
                        {isRTL ? `${fastingData.ramadanCount} يوم هذا الشهر` : `${fastingData.ramadanCount} days this month`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">
                    {isRTL ? 'فرض' : 'Obligatory'}
                  </Badge>
                </div>
              )}

              {/* Special fasting days (Ashura, Arafah, Shawwal, etc.) */}
              {fastingData.specialFasting.map(day => {
                const gregDate = new Date(day.gregorian);
                const isPast = day.gregorian < todayStr;
                return (
                  <div
                    key={`fast-${day.gregorian}`}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 ${
                      isPast ? 'opacity-50' : ''
                    } ${day.gregorian === todayStr ? 'bg-chart-2/10 border-chart-2/30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[2.5rem]">
                        <div className="text-sm font-bold">{gregDate.getDate()}</div>
                        <div className="text-2xs text-muted-foreground">
                          {isRTL ? WEEKDAYS_AR[gregDate.getDay()] : WEEKDAYS_EN[gregDate.getDay()]}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{isRTL ? day.event!.ar : day.event!.en}</p>
                        {day.event?.descEn && (
                          <p className="text-xs text-muted-foreground">{isRTL ? day.event.descAr : day.event.descEn}</p>
                        )}
                      </div>
                    </div>
                    {day.gregorian === todayStr && (
                      <Badge variant="default" className="text-xs">{t('spiritual.calendar.today', 'Today')}</Badge>
                    )}
                  </div>
                );
              })}

              {/* White Days summary */}
              {fastingData.whiteDayCount > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="h-4 w-4 text-chart-2" />
                    <div>
                      <p className="text-sm font-medium">{isRTL ? 'أيام البيض (١٣-١٤-١٥)' : 'White Days (13th-14th-15th)'}</p>
                       <p className="text-xs text-muted-foreground">
                        {isRTL ? 'صيام ثلاثة أيام من كل شهر كصيام الدهر' : 'Fasting 3 days monthly equals fasting the whole year'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{isRTL ? 'سنة' : 'Sunnah'}</Badge>
                </div>
              )}

              {/* Monday & Thursday summary */}
              {(fastingData.sunnahMondays > 0 || fastingData.sunnahThursdays > 0) && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="h-4 w-4 text-chart-2" />
                    <div>
                      <p className="text-sm font-medium">{isRTL ? 'صيام الإثنين والخميس' : 'Monday & Thursday Fasting'}</p>
                      <p className="text-xs text-muted-foreground">
                        {isRTL
                          ? `${fastingData.sunnahMondays} إثنين · ${fastingData.sunnahThursdays} خميس هذا الشهر`
                          : `${fastingData.sunnahMondays} Mondays · ${fastingData.sunnahThursdays} Thursdays this month`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{isRTL ? 'سنة' : 'Sunnah'}</Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-chart-4 fill-chart-4" /> {t('spiritual.calendar.legendEvent', 'Islamic Event')}</span>
        <span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3 text-chart-2" /> {t('spiritual.calendar.legendFasting', 'Recommended Fasting')}</span>
      </div>
    </div>
  );
}
