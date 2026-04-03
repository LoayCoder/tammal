import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
    <div className="rounded-xl px-4 py-3.5 space-y-2.5 transition-colors border bg-transparent border-[#69cbfc]/35 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-base">🕌</span>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {isAr ? 'التقويم الهجري' : 'Islamic Calendar'}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr
                ? `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`
                : `${hijri.day} ${hijri.month.en} ${hijri.year} AH`}
            </p>
          </div>
        </div>
        <Link to="/spiritual/calendar" className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          {t('common.more')}
          <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        </Link>
      </div>

      {/* Event */}
      {event && (
        <div className="rounded-lg bg-primary/[0.04] px-3 py-2">
          <p className="text-xs font-medium text-foreground">{isAr ? event.ar : event.en}</p>
          {(isAr ? event.descAr : event.descEn) && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? event.descAr : event.descEn}
            </p>
          )}
        </div>
      )}

      {/* Badges */}
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
            <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground font-medium border border-[#2a0909]/[0.48] bg-[#919191]/0">
              🤍 {isAr ? 'الأيام البيض' : 'White Day'}
            </span>
          )}
          {sunnahDay && !isRamadan && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium">
              📿 {isAr ? new Date().getDay() === 1 ? 'الاثنين' : 'الخميس' : new Date().getDay() === 1 ? 'Monday' : 'Thursday'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
