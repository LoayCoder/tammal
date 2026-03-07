import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAwardCycles, type AwardCycle } from '@/hooks/recognition/useAwardCycles';
import { getImpactWarning } from '@/lib/recognition-utils';
import { toast } from 'sonner';

interface CycleEditDialogProps {
  cycle: AwardCycle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CycleEditDialog = React.memo(function CycleEditDialog({
  cycle,
  open,
  onOpenChange,
}: CycleEditDialogProps) {
  const { t } = useTranslation();
  const { updateCycle } = useAwardCycles();

  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    nomination_start: '',
    nomination_end: '',
    peer_endorsement_end: '',
    voting_start: '',
    voting_end: '',
    announcement_date: '',
    audit_review_days: 3,
    fairness_config: '{}',
  });

  useEffect(() => {
    if (cycle) {
      setForm({
        name: cycle.name,
        name_ar: cycle.name_ar ?? '',
        nomination_start: cycle.nomination_start?.slice(0, 16) ?? '',
        nomination_end: cycle.nomination_end?.slice(0, 16) ?? '',
        peer_endorsement_end: cycle.peer_endorsement_end?.slice(0, 16) ?? '',
        voting_start: cycle.voting_start?.slice(0, 16) ?? '',
        voting_end: cycle.voting_end?.slice(0, 16) ?? '',
        announcement_date: cycle.announcement_date?.slice(0, 16) ?? '',
        audit_review_days: cycle.audit_review_days ?? 3,
        fairness_config: JSON.stringify(cycle.fairness_config ?? {}, null, 2),
      });
    }
  }, [cycle]);

  if (!cycle) return null;

  const isInProcess = cycle.status !== 'configuring';
  const impactWarning = getImpactWarning(cycle.status, t);

  const handleSave = () => {
    let parsedFairnessConfig: Record<string, unknown>;

    try {
      parsedFairnessConfig = JSON.parse(form.fairness_config || '{}') as Record<string, unknown>;
    } catch {
      toast.error(t('recognition.cycles.invalidFairnessConfig'));
      return;
    }

    updateCycle.mutate(
      {
        id: cycle.id,
        ...form,
        name_ar: form.name_ar || null,
        fairness_config: parsedFairnessConfig,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const updateField = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('recognition.cycles.editCycle')}</DialogTitle>
        </DialogHeader>

        {isInProcess && impactWarning && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('recognition.cycles.impactAlert.title')}</AlertTitle>
            <AlertDescription>{impactWarning}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('recognition.cycles.name')}</Label>
            <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('recognition.cycles.nameAr')}</Label>
            <Input value={form.name_ar} onChange={(e) => updateField('name_ar', e.target.value)} />
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
            <Input type="number" min={1} max={14} value={form.audit_review_days} onChange={(e) => updateField('audit_review_days', parseInt(e.target.value, 10) || 1)} />
          </div>

          <div className="space-y-1">
            <Label>{t('recognition.cycles.fairnessConfig')}</Label>
            <Textarea
              value={form.fairness_config}
              onChange={(e) => updateField('fairness_config', e.target.value)}
              className="font-mono"
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!form.name || updateCycle.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
