/**
 * ScheduleForm — name, description, schedule type, generation period, batches.
 * Extracted from ScheduleManagement.tsx dialog body. ZERO behaviour change.
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, Package } from 'lucide-react';
import type { ScheduleFormState } from '@/hooks/admin/useScheduleReducer';

interface ScheduleFormProps {
  state: ScheduleFormState;
  dispatch: React.Dispatch<any>;
  setField: <K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) => void;
  batches: any[];
  periods: any[];
}

export default function ScheduleForm({ state, dispatch, setField, batches, periods }: ScheduleFormProps) {
  const { t } = useTranslation();

  const linkedPeriod = state.linkedPeriodId ? periods.find((p: any) => p.id === state.linkedPeriodId) : null;

  const filteredBatches = batches.filter((b: any) => {
    const matchesPurpose = state.scheduleType === 'daily_checkin' ? b.purpose === 'wellness' : b.purpose === 'survey';
    return matchesPurpose && b.status === 'published';
  });

  return (
    <>
      <div className="space-y-2">
        <Label>{t('schedules.name')}</Label>
        <Input
          value={state.name}
          onChange={e => setField('name', e.target.value)}
          placeholder={t('schedules.namePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('schedules.description')}</Label>
        <Textarea
          value={state.description}
          onChange={e => setField('description', e.target.value)}
          placeholder={t('schedules.descriptionPlaceholder')}
          rows={2}
        />
      </div>

      {/* Schedule Type Selector */}
      <div className="space-y-2">
        <Label>{t('schedules.scheduleType')}</Label>
        <RadioGroup
          value={state.scheduleType}
          onValueChange={(val) => dispatch({ type: 'CHANGE_SCHEDULE_TYPE', scheduleType: val })}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="daily_checkin" id="type-checkin" />
            <Label htmlFor="type-checkin" className="font-normal cursor-pointer">
              {t('schedules.dailyCheckin')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="survey" id="type-survey" />
            <Label htmlFor="type-survey" className="font-normal cursor-pointer">
              {t('schedules.survey')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Link to Generation Period */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          {t('aiGenerator.generationPeriod')}
        </Label>
        <Select
          value={state.linkedPeriodId || '__none__'}
          onValueChange={(v) => {
            if (v === '__none__') {
              setField('linkedPeriodId', null);
            } else {
              setField('linkedPeriodId', v);
              const period = periods.find((p: any) => p.id === v);
              if (period) {
                setField('startDate', period.start_date.includes('T') ? period.start_date : `${period.start_date}T00:00`);
                setField('endDate', period.end_date.includes('T') ? period.end_date : `${period.end_date}T23:59`);
              }
            }
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t('common.none')}</SelectItem>
            {periods.filter((p: any) => p.status === 'active' && p.purpose === (state.scheduleType === 'daily_checkin' ? 'wellness' : 'survey')).map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.start_date} → {p.end_date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {linkedPeriod && (
          <Badge variant="secondary" className="text-xs">
            {t('aiGenerator.periodLinked')}: {linkedPeriod.start_date} → {linkedPeriod.end_date}
          </Badge>
        )}
      </div>

      {/* Question Batches Multi-Select */}
      <div className="space-y-2">
        <Label>{t('schedules.questionBatches')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start font-normal">
              <Package className="h-4 w-4 me-2" />
              {state.selectedBatchIds.length > 0
                ? t('schedules.batchesSelected', { count: state.selectedBatchIds.length })
                : t('schedules.selectBatches')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-60 overflow-y-auto" align="start">
            {filteredBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">{t('schedules.noBatchesAvailable')}</p>
            ) : (
              <div className="space-y-2">
                {filteredBatches.map((batch: any) => {
                  const isSelected = state.selectedBatchIds.includes(batch.id);
                  const isDisabled = !isSelected && state.selectedBatchIds.length >= 3;
                  return (
                    <label
                      key={batch.id}
                      className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setField('selectedBatchIds', [...state.selectedBatchIds, batch.id]);
                          } else {
                            setField('selectedBatchIds', state.selectedBatchIds.filter((id: string) => id !== batch.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{batch.name || 'Unnamed Batch'}</span>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {batch.question_count}
                      </Badge>
                    </label>
                  );
                })}
                {state.selectedBatchIds.length >= 3 && (
                  <p className="text-xs text-muted-foreground pt-1">{t('schedules.maxBatchesReached')}</p>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
