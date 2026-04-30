import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface TaskData {
  id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  priority?: number;
  estimated_minutes?: number | null;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  onSubmit: (payload: { task_id: string; action: 'edit'; justification: string; title: string; title_ar?: string; description?: string; priority?: number; estimated_minutes?: number }) => Promise<unknown>;
  isSubmitting: boolean;
}

export function EditTaskDialog({ open, onOpenChange, task, onSubmit, isSubmitting }: EditTaskDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('3');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [justification, setJustification] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const editTaskSchema = z.object({
    taskId: z.string().min(1, 'Task is required'),
    title: z.string().trim().min(2, 'Title is required'),
    titleAr: z.string().optional(),
    description: z.string().optional(),
    priority: z.coerce.number().int().min(1, 'Priority must be between 1 and 5').max(5, 'Priority must be between 1 and 5'),
    estimatedMinutes: z.union([z.string().length(0), z.coerce.number().int().min(1, 'Estimated minutes must be at least 1')]),
    justification: z.string().trim().min(3, 'Justification must be at least 3 characters'),
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title ?? '');
      setTitleAr(task.title_ar ?? '');
      setDescription(task.description ?? '');
      setPriority(String(task.priority ?? 3));
      setEstimatedMinutes(task.estimated_minutes ? String(task.estimated_minutes) : '');
      setJustification('');
    }
  }, [task]);

  const handleSubmit = async () => {
    const parsed = editTaskSchema.safeParse({
      taskId: task?.id || '',
      title,
      titleAr,
      description,
      priority,
      estimatedMinutes,
      justification,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0] || '',
        priority: fieldErrors.priority?.[0] || '',
        estimatedMinutes: fieldErrors.estimatedMinutes?.[0] || '',
        justification: fieldErrors.justification?.[0] || '',
      });
      return;
    }
    setErrors({});
    await onSubmit({
      task_id: parsed.data.taskId,
      action: 'edit',
      justification: parsed.data.justification,
      title: parsed.data.title,
      title_ar: titleAr.trim() || undefined,
      description: description.trim() || undefined,
      priority: parsed.data.priority,
      estimated_minutes: typeof parsed.data.estimatedMinutes === 'number' ? parsed.data.estimatedMinutes : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('representative.editTask')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('representative.taskTitle')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('representative.taskTitleAr')}</Label>
            <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('representative.description')}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('representative.priority')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">P1 — {t('representative.priorityHigh')}</SelectItem>
                  <SelectItem value="2">P2</SelectItem>
                  <SelectItem value="3">P3 — {t('representative.priorityNormal')}</SelectItem>
                  <SelectItem value="4">P4</SelectItem>
                  <SelectItem value="5">P5 — {t('representative.priorityLow')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('representative.estimatedMinutes')}</Label>
              <Input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} min={1} />
              {errors.estimatedMinutes && <p className="text-sm text-destructive">{errors.estimatedMinutes}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('representative.justification')} *</Label>
            <Textarea value={justification} onChange={e => setJustification(e.target.value)} rows={2} placeholder={t('representative.justificationPlaceholder')} />
            {errors.justification && <p className="text-sm text-destructive">{errors.justification}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !justification.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
