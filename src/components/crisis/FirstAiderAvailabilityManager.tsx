import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useFirstAiderSchedule } from '@/hooks/crisis/useCrisisSupport';
import { toast } from 'sonner';
import { Clock, Calendar, Shield, AlertTriangle } from 'lucide-react';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const DEFAULT_WEEKLY_RULES: Record<string, { from: string; to: string }[]> = {
  sun: [{ from: '09:00', to: '17:00' }],
  mon: [{ from: '09:00', to: '17:00' }],
  tue: [{ from: '09:00', to: '17:00' }],
  wed: [{ from: '09:00', to: '17:00' }],
  thu: [{ from: '09:00', to: '17:00' }],
  fri: [],
  sat: [],
};

interface Props {
  firstAiderId: string;
  tenantId: string;
  availabilityConfig?: Record<string, any> | null;
  onConfigUpdate?: (config: Record<string, any>) => void;
}

export default function FirstAiderAvailabilityManager({ firstAiderId, tenantId, availabilityConfig, onConfigUpdate }: Props) {
  const { t } = useTranslation();
  const { schedule, upsertSchedule } = useFirstAiderSchedule(firstAiderId);

  const [rules, setRules] = useState<Record<string, { from: string; to: string }[]>>(DEFAULT_WEEKLY_RULES);
  const [sla, setSla] = useState(60);
  const [isEnabled, setIsEnabled] = useState(true);
  const [tempUnavailable, setTempUnavailable] = useState(false);
  const [maxDailySessions, setMaxDailySessions] = useState(6);
  const [minNoticeHours, setMinNoticeHours] = useState(4);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(14);
  const [emergencyOverride, setEmergencyOverride] = useState(true);

  useEffect(() => {
    if (schedule) {
      setRules(schedule.weekly_rules || DEFAULT_WEEKLY_RULES);
      setSla(schedule.response_sla_minutes);
      setIsEnabled(schedule.is_enabled);
      setTempUnavailable(schedule.temp_unavailable);
    }
    if (availabilityConfig) {
      setMaxDailySessions(availabilityConfig.max_daily_sessions ?? 6);
      setMinNoticeHours(availabilityConfig.min_notice_hours ?? 4);
      setAdvanceBookingDays(availabilityConfig.advance_booking_days ?? 14);
      setEmergencyOverride(availabilityConfig.emergency_override ?? true);
    }
  }, [schedule, availabilityConfig]);

  const handleSave = async () => {
    try {
      await upsertSchedule.mutateAsync({
        first_aider_id: firstAiderId,
        tenant_id: tenantId,
        weekly_rules: rules as any,
        response_sla_minutes: sla,
        is_enabled: isEnabled,
        temp_unavailable: tempUnavailable,
      });

      const config = { max_daily_sessions: maxDailySessions, min_notice_hours: minNoticeHours, advance_booking_days: advanceBookingDays, emergency_override: emergencyOverride };
      onConfigUpdate?.(config);

      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const toggleDay = (day: string) => {
    const newRules = { ...rules };
    if ((newRules[day] || []).length > 0) {
      newRules[day] = [];
    } else {
      newRules[day] = [{ from: '09:00', to: '17:00' }];
    }
    setRules(newRules);
  };

  const addSlot = (day: string) => {
    const newRules = { ...rules };
    const existing = newRules[day] || [];
    const lastEnd = existing.length > 0 ? existing[existing.length - 1].to : '09:00';
    newRules[day] = [...existing, { from: lastEnd, to: '17:00' }];
    setRules(newRules);
  };

  const removeSlot = (day: string, idx: number) => {
    const newRules = { ...rules };
    newRules[day] = newRules[day].filter((_, i) => i !== idx);
    setRules(newRules);
  };

  const updateSlot = (day: string, idx: number, field: 'from' | 'to', value: string) => {
    const newRules = { ...rules };
    newRules[day] = [...newRules[day]];
    newRules[day][idx] = { ...newRules[day][idx], [field]: value };
    setRules(newRules);
  };

  return (
    <div className="space-y-6">
      {/* Status & Quick Controls */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2"><Calendar className="h-5 w-5 text-primary" /></div>
              <div>
                <CardTitle className="text-lg">{t('crisisSupport.scheduling.availability')}</CardTitle>
                <CardDescription>{t('crisisSupport.scheduling.availabilityDesc')}</CardDescription>
              </div>
            </div>
            <Badge variant={isEnabled && !tempUnavailable ? 'default' : 'secondary'}>
              {tempUnavailable ? t('crisisSupport.firstAider.tempUnavailable') : isEnabled ? t('crisisSupport.status.online') : t('crisisSupport.status.offline')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t('crisisSupport.scheduling.enabled')}</Label>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('crisisSupport.firstAider.tempUnavailable')}</Label>
              <p className="text-xs text-muted-foreground">{t('crisisSupport.scheduling.tempUnavailableDesc')}</p>
            </div>
            <Switch checked={tempUnavailable} onCheckedChange={setTempUnavailable} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('crisisSupport.scheduling.emergencyOverride')}</Label>
              <p className="text-xs text-muted-foreground">{t('crisisSupport.scheduling.emergencyOverrideDesc')}</p>
            </div>
            <Switch checked={emergencyOverride} onCheckedChange={setEmergencyOverride} />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule Grid */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('crisisSupport.scheduling.weeklySchedule')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAY_KEYS.map(day => {
            const slots = rules[day] || [];
            const isOff = slots.length === 0;
            return (
              <div key={day} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-12 text-sm font-medium capitalize shrink-0 mt-1 ${isOff ? 'text-muted-foreground' : 'text-foreground'}`}
                >
                  {t(`orgDashboard.days.${day}`)}
                </button>
                <div className="flex-1">
                  {isOff ? (
                    <span className="text-sm text-muted-foreground italic">{t('crisisSupport.admin.dayOff')}</span>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input type="time" value={slot.from} className="w-28" onChange={e => updateSlot(day, i, 'from', e.target.value)} />
                          <span className="text-muted-foreground">–</span>
                          <Input type="time" value={slot.to} className="w-28" onChange={e => updateSlot(day, i, 'to', e.target.value)} />
                          {slots.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeSlot(day, i)} className="text-xs text-destructive">✕</Button>
                          )}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addSlot(day)} className="text-xs">
                        + {t('crisisSupport.admin.addSlot')}
                      </Button>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleDay(day)} className="text-xs shrink-0">
                  {isOff ? t('crisisSupport.admin.addSlot') : t('crisisSupport.admin.markOff')}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Session Limits & SLA */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('crisisSupport.scheduling.sessionLimits')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>{t('crisisSupport.scheduling.maxDailySessions')}</Label>
            <div className="flex items-center gap-3">
              <Slider value={[maxDailySessions]} onValueChange={v => setMaxDailySessions(v[0])} min={1} max={12} step={1} className="flex-1" />
              <span className="text-sm font-medium w-8 text-end">{maxDailySessions}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('crisisSupport.scheduling.minNotice')}</Label>
            <p className="text-xs text-muted-foreground">{t('crisisSupport.scheduling.minNoticeDesc')}</p>
            <div className="flex items-center gap-3">
              <Slider value={[minNoticeHours]} onValueChange={v => setMinNoticeHours(v[0])} min={0} max={24} step={1} className="flex-1" />
              <span className="text-sm font-medium w-10 text-end">{minNoticeHours}h</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('crisisSupport.scheduling.advanceBooking')}</Label>
            <div className="flex items-center gap-3">
              <Slider value={[advanceBookingDays]} onValueChange={v => setAdvanceBookingDays(v[0])} min={1} max={30} step={1} className="flex-1" />
              <span className="text-sm font-medium w-10 text-end">{advanceBookingDays}d</span>
            </div>
          </div>

          <div>
            <Label>{t('crisisSupport.admin.slaMinutes')}</Label>
            <Input type="number" min={5} max={480} value={sla} onChange={e => setSla(parseInt(e.target.value) || 60)} className="w-32 mt-1" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">{t('common.save')}</Button>
    </div>
  );
}
