import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel: string;
  description: string;
  onConfirm: (justification: string) => void;
  isPending?: boolean;
}

export function JustificationDialog({ open, onOpenChange, actionLabel, description, onConfirm, isPending }: Props) {
  const { t } = useTranslation();
  const [justification, setJustification] = useState('');

  const handleConfirm = () => {
    if (!justification.trim()) return;
    onConfirm(justification.trim());
    setJustification('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t('governance.justification.label')}</Label>
          <Textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder={t('governance.justification.placeholder')}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirm} disabled={!justification.trim() || isPending}>
            {isPending ? t('common.loading') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
