import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Unlock } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (justification: string) => void;
  isPending?: boolean;
}

export function UnlockRequestDialog({ open, onOpenChange, taskTitle, onConfirm, isPending }: Props) {
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
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-4 w-4" />
            {t('governance.unlock.title')}
          </DialogTitle>
          <DialogDescription>
            {t('governance.unlock.description', { title: taskTitle })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t('governance.justification.label')}</Label>
          <Textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder={t('governance.unlock.placeholder')}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirm} disabled={!justification.trim() || isPending}>
            {isPending ? t('common.loading') : t('governance.unlock.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
