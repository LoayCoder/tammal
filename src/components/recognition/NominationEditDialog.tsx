import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Nomination } from '@/hooks/recognition/useNominations';

interface NominationEditDialogProps {
  nomination: Nomination | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: string; headline: string; justification: string; specific_examples?: string[]; impact_metrics?: string[] }) => void;
  isSaving?: boolean;
  nomineeName?: string;
}

export function NominationEditDialog({
  nomination,
  open,
  onOpenChange,
  onSave,
  isSaving,
  nomineeName,
}: NominationEditDialogProps) {
  const { t } = useTranslation();
  const [headline, setHeadline] = useState('');
  const [justification, setJustification] = useState('');
  const [examples, setExamples] = useState('');
  const [metrics, setMetrics] = useState('');

  useEffect(() => {
    if (nomination) {
      setHeadline(nomination.headline);
      setJustification(nomination.justification);
      setExamples(nomination.specific_examples?.join('\n') ?? '');
      setMetrics(nomination.impact_metrics?.join('\n') ?? '');
    }
  }, [nomination]);

  const handleSave = () => {
    if (!nomination) return;
    onSave({
      id: nomination.id,
      headline: headline.trim(),
      justification: justification.trim(),
      specific_examples: examples.trim() ? examples.trim().split('\n').filter(Boolean) : undefined,
      impact_metrics: metrics.trim() ? metrics.trim().split('\n').filter(Boolean) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('recognition.nominations.editNomination')}</DialogTitle>
          <DialogDescription>{t('recognition.nominations.editNominationDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {nomineeName && (
            <div>
              <Label className="text-muted-foreground">{t('recognition.nominations.nominee')}</Label>
              <p className="font-medium">{nomineeName}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t('recognition.nominations.headline')}</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>{t('recognition.nominations.justification')}</Label>
            <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={4} />
          </div>

          <div className="space-y-1.5">
            <Label>{t('recognition.nominations.specificExamples')}</Label>
            <Textarea value={examples} onChange={(e) => setExamples(e.target.value)} rows={3} placeholder={t('recognition.nominations.examplesPlaceholder')} />
          </div>

          <div className="space-y-1.5">
            <Label>{t('recognition.nominations.impactMetrics')}</Label>
            <Textarea value={metrics} onChange={(e) => setMetrics(e.target.value)} rows={3} placeholder={t('recognition.nominations.impactPlaceholder')} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={!headline.trim() || !justification.trim() || isSaving}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
