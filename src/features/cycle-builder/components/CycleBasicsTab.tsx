import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateCycleInput } from '../types';

interface Props {
  form: CreateCycleInput;
  updateField: (key: keyof CreateCycleInput, value: any) => void;
  basicsValid: boolean;
  isCreating: boolean;
  onCreateCycle: () => void;
}

export const CycleBasicsTab = React.memo(function CycleBasicsTab({
  form, updateField, basicsValid, isCreating, onCreateCycle,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{t('recognition.cycles.name')}</Label>
        <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>{t('recognition.timeline.nominationStart')}</Label>
          <Input type="datetime-local" value={form.nomination_start} onChange={(e) => updateField('nomination_start', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('recognition.timeline.nominationEnd')}</Label>
          <Input type="datetime-local" value={form.nomination_end} onChange={(e) => updateField('nomination_end', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('recognition.timeline.endorsementEnd')}</Label>
          <Input type="datetime-local" value={form.peer_endorsement_end} onChange={(e) => updateField('peer_endorsement_end', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('recognition.timeline.votingStart')}</Label>
          <Input type="datetime-local" value={form.voting_start} onChange={(e) => updateField('voting_start', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('recognition.timeline.votingEnd')}</Label>
          <Input type="datetime-local" value={form.voting_end} onChange={(e) => updateField('voting_end', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('recognition.timeline.announcement')}</Label>
          <Input type="datetime-local" value={form.announcement_date} onChange={(e) => updateField('announcement_date', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{t('recognition.cycles.auditDays')}</Label>
        <Input type="number" min={1} max={14} value={form.audit_review_days} onChange={(e) => updateField('audit_review_days', parseInt(e.target.value))} />
      </div>
      <div className="flex justify-end">
        <Button onClick={onCreateCycle} disabled={!basicsValid || isCreating}>
          {t('recognition.cycleBuilder.createAndContinue')}
        </Button>
      </div>
    </div>
  );
});
