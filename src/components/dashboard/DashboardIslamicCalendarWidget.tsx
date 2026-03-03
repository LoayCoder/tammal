import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useHijriToday, ISLAMIC_EVENTS, isWhiteDay, isSunnahFastingDay } from '@/hooks/spiritual/useHijriCalendar';

export function DashboardIslamicCalendarWidget() {
  const { t, i18n } = useTranslation();
  const { isEnabled } = useSpiritualPreferences();
  const { data: hijri, isPending } = useHijriToday();
  const isAr = i18n.language === 'ar';

  if (!isEnabled || isPending || !hijri) return null;

  const hijriDay = parseInt(hijri.day, 10);
  const eventKey = `${hijri.month.number}-${hijriDay}`;
  const event = ISLAMIC_EVENTS[eventKey];
  const whiteDay = isWhiteDay(hijriDay);
  const sunnahDay = isSunnahFastingDay(new Date());
  const isRamadan = hijri.month.number === 9;

  const hasFasting = whiteDay || sunnahDay || event?.isFastingDay || isRamadan;

  return (
    <Card className="glass-card border-0 ring-1 ring-chart-2/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <h3 className="font-semibold text-sm">
                {isAr ? 'التقويم الهجري' : 'Islamic Calendar'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`
                  : `${hijri.day} ${hijri.month.en} ${hijri.year} AH`}
              </p>
            </div>
          </div>
          <Link to="/spiritual/calendar">
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
              {t('common.more')}
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>

        {/* Event of the day */}
        {event && (
          <div className="rounded-xl bg-chart-2/5 p-3">
            <p className="text-sm font-semibold">{isAr ? event.ar : event.en}</p>
            {(isAr ? event.descAr : event.descEn) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr ? event.descAr : event.descEn}
              </p>
            )}
          </div>
        )}

        {/* Fasting badges */}
        {hasFasting && (
          <div className="flex flex-wrap gap-2">
            {isRamadan && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-chart-4/10 text-chart-4 border border-chart-4/30 font-medium">
                🌙 {isAr ? 'رمضان' : 'Ramadan'}
              </span>
            )}
            {event?.isFastingDay && !isRamadan && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-chart-4/10 text-chart-4 border border-chart-4/30 font-medium">
                🍽️ {isAr ? 'يوم صيام' : 'Fasting Day'}
              </span>
            )}
            {whiteDay && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                🤍 {isAr ? 'الأيام البيض' : 'White Day'}
              </span>
            )}
            {sunnahDay && !isRamadan && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                📿 {isAr ? new Date().getDay() === 1 ? 'الاثنين' : 'الخميس' : new Date().getDay() === 1 ? 'Monday' : 'Thursday'}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
