import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, UtensilsCrossed } from 'lucide-react';

interface EnrichedDay {
  gregorian: string;
  hijri: { day: string; month: { number: number; en: string; ar: string }; year: string; holidays?: string[] };
  event?: { en: string; ar: string; descEn?: string; descAr?: string; isFastingDay?: boolean } | null;
  isWhiteDay: boolean;
  isSunnahDay: boolean;
  isRamadan: boolean;
}

interface FastingData {
  specialFasting: EnrichedDay[];
  sunnahMondays: number;
  sunnahThursdays: number;
  whiteDayCount: number;
  ramadanCount: number;
}

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

interface CalendarEventListProps {
  islamicEvents: EnrichedDay[];
  fastingData: FastingData;
  todayStr: string;
  isRTL: boolean;
}

export function CalendarEventList({ islamicEvents, fastingData, todayStr, isRTL }: CalendarEventListProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Islamic Events */}
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
              const label = day.event ? (isRTL ? day.event.ar : day.event.en) : day.hijri.holidays?.[0] || '';
              const desc = day.event ? (isRTL ? day.event.descAr : day.event.descEn) : undefined;
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

      {/* Recommended Fasting Days */}
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
                  <Badge variant="default" className="text-xs">{isRTL ? 'فرض' : 'Obligatory'}</Badge>
                </div>
              )}

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
    </>
  );
}
