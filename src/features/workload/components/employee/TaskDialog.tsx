import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Lock, ShieldCheck } from 'lucide-react';
import type { UnifiedTask, UnifiedTaskInsert, UnifiedTaskUpdate, TaskComment } from '@/features/workload/hooks/useUnifiedTasks';
import { useTaskEvidenceUpload } from '@/features/workload';
import { toast } from 'sonner';
import { TaskDialogForm } from './task-dialog/TaskDialogForm';
import { TaskCommentSection } from './task-dialog/TaskCommentSection';
import { TaskEvidenceSection } from './task-dialog/TaskEvidenceSection';

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
  const [closureComment, setClosureComment] = useState('');
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const [closureError, setClosureError] = useState(false);
  const { evidence, uploading, loadEvidence, uploadEvidence } = useTaskEvidenceUpload(tenantId);

  useEffect(() => {
    setProgress(task?.progress ?? 0);
    setClosureComment('');
    setClosureError(false);
    if (task?.id) loadEvidence(task.id);
  }, [task?.id, open]);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      title: task?.title ?? '', description: task?.description ?? '',
      priority: task?.priority ?? 3, status: task?.status ?? 'draft',
      estimated_minutes: task?.estimated_minutes ?? null,
      due_date: task?.due_date ? task.due_date.split('T')[0] : '',
      scheduled_start: task?.scheduled_start ? task.scheduled_start.split('T')[0] : '',
    },
  });

  const computeStatus = (prog: number, currentStatus: string) => {
    if (prog >= 100) return 'completed';
    if (prog > 0 && ['draft', 'open'].includes(currentStatus)) return 'in_progress';
    if (currentStatus === 'todo' || currentStatus === 'blocked') return 'open';
    return currentStatus || 'open';
  };

  const onSubmit = (data: any) => {
    const derivedStatus = computeStatus(progress, data.status);
    if (derivedStatus === 'completed' && progress >= 100 && !closureComment.trim() && isEdit) {
      setClosureError(true);
      return;
    }
    if (isEdit && task) {
      if (derivedStatus === 'completed' && closureComment.trim() && onAddComment) {
        onAddComment({
          id: task.id,
          comment: {
            id: crypto.randomUUID(), employee_id: employeeId,
            employee_name: currentEmployeeName || 'User',
            text: `📋 ${t('workload.tasks.closureComment')}: ${closureComment.trim()}`,
            created_at: new Date().toISOString(),
          },
        });
      }
      onUpdate({
        id: task.id, title: data.title, description: data.description || null,
        priority: Number(data.priority), status: derivedStatus, progress,
        estimated_minutes: data.estimated_minutes ? Number(data.estimated_minutes) : null,
        due_date: data.due_date || null, scheduled_start: data.scheduled_start || null,
      });
    } else {
      onCreate({
        tenant_id: tenantId, employee_id: employeeId, title: data.title,
        description: data.description || null, priority: Number(data.priority),
        status: 'draft', estimated_minutes: data.estimated_minutes ? Number(data.estimated_minutes) : null,
        due_date: data.due_date || null, source_type: 'manual',
      });
    }
    onOpenChange(false);
    reset();
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !task) return;
    const success = await uploadEvidence(task.id, employeeId, e.target.files[0]);
    if (success) toast.success(t('workload.tasks.evidenceUploaded'));
    else toast.error(t('workload.tasks.evidenceUploadError'));
    e.target.value = '';
  };

  const handleMarkVerified = () => {
    if (!task) return;
    onUpdate({ id: task.id, metadata: { ...(task.metadata as Record<string, unknown> ?? {}), verified: true } } as UnifiedTaskUpdate);
    toast.success(t('workload.tasks.verified'));
    onOpenChange(false);
  };

  const isCompleted = task?.status === 'completed';
  const isVerified = !!(task?.metadata as Record<string, unknown>)?.verified;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? t('commandCenter.editTask') : t('commandCenter.addTask')}
            {isLocked && <Lock className="h-4 w-4 text-chart-4" />}
            {isVerified && <ShieldCheck className="h-4 w-4 text-primary" />}
          </DialogTitle>
          <DialogDescription>{isEdit ? t('commandCenter.editTaskDesc') : t('commandCenter.addTaskDesc')}</DialogDescription>
        </DialogHeader>

        {isEdit && task && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-2xs">{t('workload.tasks.source')}: {task.source_type}</Badge>
            {task.created_by && <Badge variant="outline" className="text-2xs">{t('workload.tasks.createdBy')}: {task.created_by}</Badge>}
            <Badge variant="outline" className="text-2xs">{new Date(task.created_at).toLocaleDateString()}</Badge>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TaskDialogForm
            isEdit={isEdit} isLocked={isLocked} isVerified={isVerified} task={task}
            register={register} watch={watch} setValue={setValue}
            progress={progress} onProgressChange={setProgress} computeStatus={computeStatus}
            closureComment={closureComment} onClosureCommentChange={setClosureComment}
            closureError={closureError} onClosureErrorClear={() => setClosureError(false)}
            onUpdate={onUpdate}
          />

          {isEdit && task && (isCompleted || isVerified) && (
            <TaskEvidenceSection
              evidence={evidence} isVerified={isVerified} isCompleted={isCompleted}
              uploading={uploading} onUpload={handleEvidenceUpload} onMarkVerified={handleMarkVerified}
            />
          )}

          {isEdit && (
            <TaskCommentSection
              comments={task?.comments ?? []} employeeId={employeeId}
              currentEmployeeName={currentEmployeeName} onAddComment={onAddComment}
              taskId={task?.id ?? ''}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            {!isVerified && (
              <Button type="submit" disabled={isSubmitting}>{isEdit ? t('common.save') : t('common.create')}</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
