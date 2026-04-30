import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarClock } from 'lucide-react';
import { typography } from "@/theme/tokens";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const extendDueDateSchema = z.object({
    taskId: z.string().min(1, 'Task is required'),
    newDueDate: z.string().min(1, 'New due date is required'),
    justification: z.string().trim().min(3, 'Justification must be at least 3 characters'),
  });

  useEffect(() => {
    setNewDueDate('');
    setJustification('');
  }, [taskId, open]);

  const handleSubmit = async () => {
    const parsed = extendDueDateSchema.safeParse({
      taskId: taskId || '',
      newDueDate,
      justification,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        newDueDate: fieldErrors.newDueDate?.[0] || '',
        justification: fieldErrors.justification?.[0] || '',
      });
      return;
    }
    setErrors({});
    await onSubmit({ task_id: parsed.data.taskId, action: 'extend_due_date', justification: parsed.data.justification, new_due_date: parsed.data.newDueDate });
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
          <p className={typography.subtitle}>{taskTitle}</p>

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
            {errors.newDueDate && <p className="text-sm text-destructive">{errors.newDueDate}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('representative.justification')} *</Label>
            <Textarea value={justification} onChange={e => setJustification(e.target.value)} rows={2} placeholder={t('representative.extendJustificationPlaceholder')} />
            {errors.justification && <p className="text-sm text-destructive">{errors.justification}</p>}
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
