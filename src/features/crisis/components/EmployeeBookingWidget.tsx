import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useSessionScheduling, BookableSlot } from '@/features/crisis/hooks/crisis/useSessionScheduling';
import { Calendar, Clock, Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  firstAiderId: string;
  tenantId: string;
  caseId?: string;
  displayName: string;
  communicationChannel: string;
  onBooked?: () => void;
  onCancel?: () => void;
}

export default function EmployeeBookingWidget({ firstAiderId, tenantId, caseId, displayName, communicationChannel, onBooked, onCancel }: Props) {
  const { t } = useTranslation();
  const { getAvailableSlots, bookSession } = useSessionScheduling();

  const [slots, setSlots] = useState<BookableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);

  const today = startOfDay(new Date());
  const weekStart = addDays(today, weekOffset * 7);
  const weekEnd = addDays(weekStart, 6);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAvailableSlots(
      firstAiderId,
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd'),
      tenantId
    ).then(result => {
      if (!cancelled) {
        setSlots(result);
        setLoading(false);
        setDayIndex(0);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [firstAiderId, weekOffset]);

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, BookableSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(slotsByDate).sort();
  const currentDate = sortedDates[dayIndex] || null;
  const currentSlots = currentDate ? slotsByDate[currentDate] : [];

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await bookSession.mutateAsync({
        tenant_id: tenantId,
        first_aider_id: firstAiderId,
        case_id: caseId,
        date: selectedSlot.date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        communication_channel: communicationChannel,
      });
      toast.success(t('crisisSupport.scheduling.booked'));
      onBooked?.();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBooking(false);
    }
  };

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {t('crisisSupport.scheduling.bookSession')}
        </CardTitle>
        <CardDescription>
          {t('crisisSupport.scheduling.bookWithName', { name: displayName })}
          <span className="block text-xs mt-1">🌐 {timezone}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-muted-foreground">{t('crisisSupport.scheduling.noSlots')}</p>
            <p className="text-xs text-muted-foreground">{t('crisisSupport.scheduling.tryNextWeek')}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0}>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                {t('common.previous', 'Previous Week')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setWeekOffset(weekOffset + 1); }} disabled={weekOffset >= 3}>
                {t('common.next', 'Next Week')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Day navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (dayIndex > 0) {
                    setDayIndex(dayIndex - 1);
                  } else if (weekOffset > 0) {
                    setWeekOffset(weekOffset - 1);
                    // dayIndex will reset to 0 via useEffect
                  }
                }}
                disabled={dayIndex === 0 && weekOffset === 0}
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {currentDate && format(new Date(currentDate + 'T12:00:00'), 'EEEE, MMM d')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentSlots.length} {t('crisisSupport.scheduling.slotsAvailable', 'slots available')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (dayIndex < sortedDates.length - 1) {
                    setDayIndex(dayIndex + 1);
                  } else if (weekOffset < 3) {
                    setWeekOffset(weekOffset + 1);
                    // dayIndex will reset to 0 via useEffect
                  }
                }}
                disabled={dayIndex >= sortedDates.length - 1 && weekOffset >= 3}
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>

            {/* Time slots grid */}
            <div className="flex flex-wrap gap-2">
              {currentSlots.map((slot, idx) => {
                const isSelected = selectedSlot?.date === slot.date && selectedSlot?.start === slot.start;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {slot.start} – {slot.end}
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            {/* Day dots indicator */}
            <div className="flex justify-center gap-1">
              {sortedDates.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDayIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === dayIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirmation */}
        {selectedSlot && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">{t('crisisSupport.scheduling.confirmBooking')}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(selectedSlot.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {selectedSlot.start} – {selectedSlot.end}
            </div>
            <Badge variant="secondary" className="text-xs">{communicationChannel}</Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {t('common.cancel')}
            </Button>
          )}
          <Button onClick={handleBook} disabled={!selectedSlot || booking} className="flex-1">
            {booking ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : null}
            {t('crisisSupport.scheduling.confirmBook')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

