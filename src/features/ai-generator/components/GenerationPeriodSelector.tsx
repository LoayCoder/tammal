import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CalendarClock, Plus, Lock, TimerOff, Trash2 } from 'lucide-react';
import type { AIGeneratorState } from '@/features/ai-generator/types';

interface PeriodSelectorProps {
  selectedPeriodId: string | null;
  periods: AIGeneratorState['periods'];
  purpose: string;
  activePeriodForPurpose: AIGeneratorState['activePeriodForPurpose'];
  isPeriodLocked: boolean;
  isGenerationLocked: boolean;
  onPeriodChange: (v: string | null) => void;
  onExpirePeriod: (id: string) => void;
  onDeletePeriod: (id: string) => void;
  onCreatePeriodOpen: () => void;
}

export function GenerationPeriodSelector({
  selectedPeriodId,
  periods,
  purpose,
  activePeriodForPurpose,
  isPeriodLocked,
  isGenerationLocked,
  onPeriodChange,
  onExpirePeriod,
  onDeletePeriod,
  onCreatePeriodOpen,
}: PeriodSelectorProps) {
  const { t } = useTranslation();

  const purposePeriods = periods.filter(p => p.purpose === purpose);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <CalendarClock className="h-4 w-4" />
        {t('aiGenerator.generationPeriod')}
      </Label>
      <div className="flex gap-2">
        <Select
          value={selectedPeriodId || '__freeform__'}
          onValueChange={(v) => {
            if (v === '__freeform__') {
              onPeriodChange(null);
            } else {
              onPeriodChange(v);
            }
          }}
        >
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__freeform__">{t('aiGenerator.freeformMode')}</SelectItem>
            {purposePeriods.filter(p => p.status === 'active').map(p => (
              <SelectItem key={p.id} value={p.id}>
                {t(`aiGenerator.period${p.period_type.charAt(0).toUpperCase() + p.period_type.slice(1)}`)} — {p.start_date} → {p.end_date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onCreatePeriodOpen} title={t('aiGenerator.createPeriod')}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {isPeriodLocked && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="h-3 w-3" />
          {t('aiGenerator.periodLocked')}
        </p>
      )}
      {/* Active period management */}
      {activePeriodForPurpose && (
        <Alert className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-xs">
              {t('aiGenerator.periodActiveInfo', {
                start: activePeriodForPurpose.start_date,
                end: activePeriodForPurpose.end_date,
              })}
            </span>
            <div className="flex gap-1 ms-2">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onExpirePeriod(activePeriodForPurpose.id)}>
                <TimerOff className="h-3 w-3 me-1" />
                {t('aiGenerator.periodExpire')}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => onDeletePeriod(activePeriodForPurpose.id)}>
                <Trash2 className="h-3 w-3 me-1" />
                {t('aiGenerator.periodDelete')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}