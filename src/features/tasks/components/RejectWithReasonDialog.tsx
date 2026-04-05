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
  taskTitle: string;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

export function RejectWithReasonDialog({ open, onOpenChange, taskTitle, onConfirm, isPending }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('tasks.rejectTask')}</DialogTitle>
          <DialogDescription>{t('tasks.rejectTaskDesc', { title: taskTitle })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t('tasks.rejectionReason')}</Label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('tasks.rejectionReasonPlaceholder')}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim() || isPending}>
            {isPending ? t('common.loading') : t('tasks.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
