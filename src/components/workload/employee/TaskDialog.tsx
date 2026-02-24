import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, MessageSquare } from 'lucide-react';
import type { UnifiedTask, UnifiedTaskInsert, UnifiedTaskUpdate, TaskComment } from '@/hooks/workload/useUnifiedTasks';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: UnifiedTask | null;
  employeeId: string;
  tenantId: string;
  onCreate: (data: UnifiedTaskInsert) => void;
  onUpdate: (data: UnifiedTaskUpdate) => void;
  isSubmitting: boolean;
  onAddComment?: (data: { id: string; comment: TaskComment }) => void;
  currentEmployeeName?: string;
}

export function TaskDialog({ open, onOpenChange, task, employeeId, tenantId, onCreate, onUpdate, isSubmitting, onAddComment, currentEmployeeName }: TaskDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!task;
  const isLocked = task?.is_locked ?? false;
  const [commentText, setCommentText] = useState('');

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

  const handleAddComment = () => {
    if (!commentText.trim() || !task || !onAddComment) return;
    onAddComment({
      id: task.id,
      comment: {
        id: crypto.randomUUID(),
        employee_id: employeeId,
        employee_name: currentEmployeeName || 'User',
        text: commentText.trim(),
        created_at: new Date().toISOString(),
      },
    });
    setCommentText('');
  };

  const statusOptions = ['todo', 'in_progress', 'done', 'blocked'];
  const priorityOptions = [1, 2, 3, 4, 5];
  const comments = task?.comments ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? t('commandCenter.editTask') : t('commandCenter.addTask')}
            {isLocked && <Lock className="h-4 w-4 text-chart-4" />}
          </DialogTitle>
          <DialogDescription>{isEdit ? t('commandCenter.editTaskDesc') : t('commandCenter.addTaskDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('commandCenter.taskTitle')}</Label>
            <Input {...register('title', { required: true })} placeholder={t('commandCenter.taskTitlePlaceholder')} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <Label>{t('commandCenter.taskDescription')}</Label>
            <Textarea {...register('description')} rows={2} disabled={isLocked} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('commandCenter.priority')}</Label>
              <Select value={String(watch('priority'))} onValueChange={(v) => setValue('priority', Number(v))} disabled={isLocked}>
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
              <Input type="number" {...register('estimated_minutes')} min={0} disabled={isLocked} />
            </div>
            <div className="space-y-2">
              <Label>{t('commandCenter.dueDate')}</Label>
              <Input type="date" {...register('due_date')} disabled={isLocked} />
            </div>
          </div>

          {/* Comments Section */}
          {isEdit && (
            <div className="space-y-2 border-t pt-3">
              <Label className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />{t('workload.comments.title')} ({comments.length})
              </Label>
              {comments.length > 0 && (
                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {comments.map((c: TaskComment) => (
                      <div key={c.id} className="text-xs bg-muted/50 rounded p-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{c.employee_name}</span>
                          <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-0.5">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {onAddComment && (
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('workload.comments.placeholder')}
                    className="text-xs"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                    {t('workload.comments.add')}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            {(!isLocked || !isEdit) && (
              <Button type="submit" disabled={isSubmitting}>{isEdit ? t('common.save') : t('common.create')}</Button>
            )}
            {isLocked && isEdit && (
              <Button type="submit" disabled={isSubmitting}>{t('workload.lock.updateStatus')}</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
