import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarClock } from 'lucide-react';

interface DueDateHistoryEntry {
  old_due_date: string | null;
  new_due_date: string;
  changed_at: string;
  justification: string;
}

interface ExtendDueDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  taskTitle: string;
  currentDueDate: string | null;
  dueDateHistory: DueDateHistoryEntry[];
  onSubmit: (payload: { task_id: string; action: 'extend_due_date'; justification: string; new_due_date: string }) => Promise<unknown>;
  isSubmitting: boolean;
}

export function ExtendDueDateDialog({ open, onOpenChange, taskId, taskTitle, currentDueDate, dueDateHistory, onSubmit, isSubmitting }: ExtendDueDateDialogProps) {
  const { t } = useTranslation();
  const [newDueDate, setNewDueDate] = useState('');
  const [justification, setJustification] = useState('');

  useEffect(() => {
    setNewDueDate('');
    setJustification('');
  }, [taskId, open]);

  const handleSubmit = async () => {
    if (!taskId || !newDueDate || !justification.trim()) return;
    await onSubmit({ task_id: taskId, action: 'extend_due_date', justification: justification.trim(), new_due_date: newDueDate });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {t('representative.extendDueDate')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{taskTitle}</p>

          {currentDueDate && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('representative.currentDueDate')}</Label>
              <p className="text-sm font-medium">{new Date(currentDueDate).toLocaleDateString()}</p>
            </div>
          )}

          {/* Due date history */}
          {dueDateHistory.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('representative.dueDateHistory')}</Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {dueDateHistory.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5">
                    <Badge variant="outline" className="text-xs">
                      {entry.old_due_date ? new Date(entry.old_due_date).toLocaleDateString() : '—'}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(entry.new_due_date).toLocaleDateString()}
                    </Badge>
                    <span className="text-muted-foreground ms-auto truncate max-w-[120px]" title={entry.justification}>
                      {entry.justification}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('representative.newDueDate')} *</Label>
            <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('representative.justification')} *</Label>
            <Textarea value={justification} onChange={e => setJustification(e.target.value)} rows={2} placeholder={t('representative.extendJustificationPlaceholder')} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !newDueDate || !justification.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('representative.extend')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
