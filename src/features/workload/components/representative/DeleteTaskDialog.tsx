import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  taskTitle: string;
  onSubmit: (payload: { task_id: string; action: 'delete'; justification: string }) => Promise<unknown>;
  isSubmitting: boolean;
}

export function DeleteTaskDialog({ open, onOpenChange, taskId, taskTitle, onSubmit, isSubmitting }: DeleteTaskDialogProps) {
  const { t } = useTranslation();
  const [justification, setJustification] = useState('');

  const handleSubmit = async () => {
    if (!taskId || !justification.trim()) return;
    await onSubmit({ task_id: taskId, action: 'delete', justification: justification.trim() });
    setJustification('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('representative.deleteTask')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('representative.deleteTaskConfirm', { title: taskTitle })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label>{t('representative.justification')} *</Label>
          <Textarea value={justification} onChange={e => setJustification(e.target.value)} rows={2} placeholder={t('representative.deleteJustificationPlaceholder')} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting || !justification.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('common.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
