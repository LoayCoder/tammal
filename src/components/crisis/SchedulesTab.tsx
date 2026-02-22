import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirstAiders, useFirstAiderSchedule } from '@/hooks/useCrisisSupport';
import { toast } from 'sonner';

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

export default function SchedulesTab() {
  const { t } = useTranslation();
  const { firstAiders } = useFirstAiders();
  const [selectedFA, setSelectedFA] = useState<string>('');
  const { schedule, upsertSchedule } = useFirstAiderSchedule(selectedFA || undefined);
  const [rules, setRules] = useState<Record<string, { from: string; to: string }[]>>(DEFAULT_WEEKLY_RULES);
  const [sla, setSla] = useState(60);

  // Auto-load schedule when selection changes or schedule data arrives
  useEffect(() => {
    if (schedule) {
      setRules(schedule.weekly_rules || DEFAULT_WEEKLY_RULES);
      setSla(schedule.response_sla_minutes);
    } else if (selectedFA) {
      setRules(DEFAULT_WEEKLY_RULES);
      setSla(60);
    }
  }, [schedule, selectedFA]);

  const handleSave = async () => {
    if (!selectedFA) return;
    const fa = firstAiders.find(f => f.id === selectedFA);
    if (!fa) return;
    try {
      await upsertSchedule.mutateAsync({
        first_aider_id: selectedFA,
        tenant_id: fa.tenant_id,
        weekly_rules: rules as any,
        response_sla_minutes: sla,
      });
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('crisisSupport.admin.schedules')}</CardTitle>
        <CardDescription>{t('crisisSupport.admin.schedulesDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{t('crisisSupport.admin.selectFirstAider')}</Label>
          <Select value={selectedFA} onValueChange={setSelectedFA}>
            <SelectTrigger><SelectValue placeholder={t('crisisSupport.admin.selectFirstAider')} /></SelectTrigger>
            <SelectContent>
              {firstAiders.map(fa => (
                <SelectItem key={fa.id} value={fa.id}>{fa.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFA && (
          <>
            <div className="space-y-3">
              {DAY_KEYS.map(day => {
                const slots = rules[day] || [];
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-10 text-sm font-medium capitalize">{t(`orgDashboard.days.${day}`)}</span>
                    {slots.length === 0 ? (
                      <span className="text-sm text-muted-foreground">{t('crisisSupport.admin.dayOff')}</span>
                    ) : (
                      slots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <Input type="time" value={slot.from} className="w-28" onChange={e => {
                            const newRules = { ...rules };
                            newRules[day] = [...slots];
                            newRules[day][i] = { ...slot, from: e.target.value };
                            setRules(newRules);
                          }} />
                          <span>–</span>
                          <Input type="time" value={slot.to} className="w-28" onChange={e => {
                            const newRules = { ...rules };
                            newRules[day] = [...slots];
                            newRules[day][i] = { ...slot, to: e.target.value };
                            setRules(newRules);
                          }} />
                        </div>
                      ))
                    )}
                    <Button variant="ghost" size="sm" onClick={() => {
                      const newRules = { ...rules };
                      if (slots.length > 0) {
                        newRules[day] = [];
                      } else {
                        newRules[day] = [{ from: '09:00', to: '17:00' }];
                      }
                      setRules(newRules);
                    }}>
                      {slots.length > 0 ? t('crisisSupport.admin.markOff') : t('crisisSupport.admin.addSlot')}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div>
              <Label>{t('crisisSupport.admin.slaMinutes')}</Label>
              <Input type="number" min={5} max={480} value={sla} onChange={e => setSla(parseInt(e.target.value) || 60)} className="w-32" />
            </div>

            <Button onClick={handleSave}>{t('common.save')}</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
