/**
 * ScheduleTimingConfig — frequency, preferred time, questions-per-delivery,
 * mood overrides, survey dates, weekend day picker.
 * Extracted from ScheduleManagement.tsx dialog body. ZERO behaviour change.
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import type { ScheduleFormState } from '@/hooks/admin/useScheduleReducer';

interface MoodDef {
  key: string;
  emoji: string;
  label_en: string;
}

interface ScheduleTimingConfigProps {
  state: ScheduleFormState;
  dispatch: React.Dispatch<any>;
  setField: <K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) => void;
  activeMoods: MoodDef[];
  linkedPeriod: any;
}

export default function ScheduleTimingConfig({
  state,
  dispatch,
  setField,
  activeMoods,
  linkedPeriod,
}: ScheduleTimingConfigProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Frequency - only for daily_checkin */}
      {state.scheduleType === 'daily_checkin' && (
        <div className="space-y-2">
          <Label>{t('schedules.frequency')}</Label>
          <Select value={state.frequency} onValueChange={v => setField('frequency', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1_per_day">{t('schedules.frequencies.daily')}</SelectItem>
              <SelectItem value="2_per_day">{t('schedules.frequencies.twiceDaily')}</SelectItem>
              <SelectItem value="3_days_per_week">{t('schedules.frequencies.threePerWeek')}</SelectItem>
              <SelectItem value="weekly">{t('schedules.frequencies.weekly')}</SelectItem>
              <SelectItem value="custom">{t('schedules.frequencies.custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Start/End Date — only for survey */}
      {state.scheduleType === 'survey' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('schedules.startDate')}</Label>
            <Input
              type="datetime-local"
              value={state.startDate}
              onChange={e => setField('startDate', e.target.value)}
              readOnly={!!linkedPeriod}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('schedules.endDate')}</Label>
            <Input
              type="datetime-local"
              value={state.endDate}
              onChange={e => setField('endDate', e.target.value)}
              min={state.startDate}
              readOnly={!!linkedPeriod}
            />
          </div>
        </div>
      )}

      {/* Preferred Time + Questions Per Delivery — only for daily_checkin */}
      {state.scheduleType === 'daily_checkin' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('schedules.preferredTime')}</Label>
            <Input
              type="time"
              value={state.preferredTime}
              onChange={e => setField('preferredTime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('schedules.questionsPerDelivery')}</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => {
                  const newVal = Math.max(1, state.questionsPerDelivery - 1);
                  setField('questionsPerDelivery', newVal);
                  dispatch({ type: 'CLAMP_MOOD_OVERRIDES', maxValue: newVal });
                }}
                disabled={state.questionsPerDelivery <= 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums">
                {state.questionsPerDelivery}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setField('questionsPerDelivery', Math.min(10, state.questionsPerDelivery + 1))}
                disabled={state.questionsPerDelivery >= 10}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Per Mood Configuration */}
      {state.scheduleType === 'daily_checkin' && activeMoods.length > 0 && (
        <Collapsible open={state.moodConfigOpen} onOpenChange={v => setField('moodConfigOpen', v)}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" type="button" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                {t('schedules.questionsPerMood', 'Questions Per Mood')}
              </span>
              <div className="flex items-center gap-2">
                {Object.values(state.moodOverrides).some(o => o.enabled) && (
                  <Badge variant="default" className="text-xs">
                    {Object.values(state.moodOverrides).filter(o => o.enabled).length} {t('schedules.customized', 'customized')}
                  </Badge>
                )}
                {state.moodConfigOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border rounded-md p-3 mt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                {t('schedules.moodInheritHint', 'Moods inherit the global Questions Per Delivery value unless overridden.')}
              </p>
              {activeMoods.map(mood => {
                const override = state.moodOverrides[mood.key];
                const isOverridden = override?.enabled === true;
                const displayValue = isOverridden ? Math.min(override.value, state.questionsPerDelivery) : state.questionsPerDelivery;
                return (
                  <div key={mood.key} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{mood.emoji}</span>
                      <span className="text-sm font-medium truncate">{mood.label_en}</span>
                      <Badge variant={isOverridden ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {isOverridden ? t('schedules.customizedBadge', 'Customized') : t('schedules.defaultBadge', 'Default')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={isOverridden}
                        onCheckedChange={(checked) => {
                          dispatch({
                            type: 'SET_MOOD_OVERRIDE',
                            key: mood.key,
                            enabled: checked,
                            value: state.moodOverrides[mood.key]?.value || state.questionsPerDelivery,
                          });
                        }}
                      />
                      {isOverridden ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              dispatch({
                                type: 'SET_MOOD_OVERRIDE',
                                key: mood.key,
                                enabled: true,
                                value: Math.max(1, (state.moodOverrides[mood.key]?.value || 1) - 1),
                              });
                            }}
                            disabled={displayValue <= 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{displayValue}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              dispatch({
                                type: 'SET_MOOD_OVERRIDE',
                                key: mood.key,
                                enabled: true,
                                value: Math.min(state.questionsPerDelivery, (state.moodOverrides[mood.key]?.value || 1) + 1),
                              });
                            }}
                            disabled={displayValue >= state.questionsPerDelivery}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="w-[76px] text-center text-sm text-muted-foreground tabular-nums">{displayValue}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Weekend Days — only for daily_checkin */}
      {state.scheduleType === 'daily_checkin' && (
        <div className="space-y-2">
          <Label>{t('schedules.weekendDays')}</Label>
          <p className="text-xs text-muted-foreground">{t('schedules.weekendDaysHint')}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 0, label: t('schedules.days.sunday') },
              { value: 1, label: t('schedules.days.monday') },
              { value: 2, label: t('schedules.days.tuesday') },
              { value: 3, label: t('schedules.days.wednesday') },
              { value: 4, label: t('schedules.days.thursday') },
              { value: 5, label: t('schedules.days.friday') },
              { value: 6, label: t('schedules.days.saturday') },
            ].map(day => {
              const isSelected = state.weekendDays.includes(day.value);
              return (
                <Button
                  key={day.value}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[70px]"
                  onClick={() => {
                    setField(
                      'weekendDays',
                      isSelected
                        ? state.weekendDays.filter(d => d !== day.value)
                        : [...state.weekendDays, day.value],
                    );
                  }}
                >
                  {day.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
