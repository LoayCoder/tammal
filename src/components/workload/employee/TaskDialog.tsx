import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UnifiedTask, UnifiedTaskInsert, UnifiedTaskUpdate } from '@/hooks/workload/useUnifiedTasks';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: UnifiedTask | null;
  employeeId: string;
  tenantId: string;
  onCreate: (data: UnifiedTaskInsert) => void;
  onUpdate: (data: UnifiedTaskUpdate) => void;
  isSubmitting: boolean;
}

export function TaskDialog({ open, onOpenChange, task, employeeId, tenantId, onCreate, onUpdate, isSubmitting }: TaskDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!task;

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 3,
      status: task?.status ?? 'todo',
      estimated_minutes: task?.estimated_minutes ?? null,
      due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    },
  });

  const onSubmit = (data: any) => {
    if (isEdit && task) {
      onUpdate({
        id: task.id,
        title: data.title,
        description: data.description || null,
        priority: Number(data.priority),
        status: data.status,
        estimated_minutes: data.estimated_minutes ? Number(data.estimated_minutes) : null,
        due_date: data.due_date || null,
      });
    } else {
      onCreate({
        tenant_id: tenantId,
        employee_id: employeeId,
        title: data.title,
        description: data.description || null,
        priority: Number(data.priority),
        status: data.status,
        estimated_minutes: data.estimated_minutes ? Number(data.estimated_minutes) : null,
        due_date: data.due_date || null,
        source_type: 'manual',
      });
    }
    onOpenChange(false);
    reset();
  };

  const statusOptions = ['todo', 'in_progress', 'done', 'blocked'];
  const priorityOptions = [1, 2, 3, 4, 5];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('commandCenter.editTask') : t('commandCenter.addTask')}</DialogTitle>
          <DialogDescription>{isEdit ? t('commandCenter.editTaskDesc') : t('commandCenter.addTaskDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('commandCenter.taskTitle')}</Label>
            <Input {...register('title', { required: true })} placeholder={t('commandCenter.taskTitlePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('commandCenter.taskDescription')}</Label>
            <Textarea {...register('description')} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('commandCenter.priority')}</Label>
              <Select value={String(watch('priority'))} onValueChange={(v) => setValue('priority', Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(p => (
                    <SelectItem key={p} value={String(p)}>P{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s} value={s}>{t(`workload.status.${s === 'todo' ? 'planned' : s === 'in_progress' ? 'inProgress' : s === 'done' ? 'completed' : 'blocked'}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('commandCenter.estMinutes')}</Label>
              <Input type="number" {...register('estimated_minutes')} min={0} />
            </div>
            <div className="space-y-2">
              <Label>{t('commandCenter.dueDate')}</Label>
              <Input type="date" {...register('due_date')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>{isEdit ? t('common.save') : t('common.create')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
