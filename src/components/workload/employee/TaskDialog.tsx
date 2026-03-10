import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, MessageSquare, ShieldCheck, Upload, AlertCircle } from 'lucide-react';
import type { UnifiedTask, UnifiedTaskInsert, UnifiedTaskUpdate, TaskComment } from '@/features/workload/hooks/useUnifiedTasks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskEvidenceUpload } from '@/features/workload';
import { toast } from 'sonner';

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
  const [closureComment, setClosureComment] = useState('');
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const [closureError, setClosureError] = useState(false);
  const { evidence, uploading, loadEvidence, uploadEvidence } = useTaskEvidenceUpload(tenantId);
  

  useEffect(() => {
    setProgress(task?.progress ?? 0);
    setClosureComment('');
    setClosureError(false);
    if (task?.id) {
      loadEvidence(task.id);
    }
  }, [task?.id, open]);

  // loadEvidence is now handled by the hook

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 3,
      status: task?.status ?? 'draft',
      estimated_minutes: task?.estimated_minutes ?? null,
      due_date: task?.due_date ? task.due_date.split('T')[0] : '',
      scheduled_start: task?.scheduled_start ? task.scheduled_start.split('T')[0] : '',
    },
  });

  // Compute derived status from progress
  const computeStatus = (prog: number, currentStatus: string) => {
    if (prog >= 100) return 'completed';
    if (prog > 0 && ['draft', 'open'].includes(currentStatus)) return 'in_progress';
    // Map legacy statuses
    if (currentStatus === 'todo' || currentStatus === 'blocked') return 'open';
    return currentStatus || 'open';
  };

  const watchedStatus = watch('status');

  const onSubmit = (data: any) => {
    const derivedStatus = computeStatus(progress, data.status);

    // Require closure comment when completing
    if (derivedStatus === 'completed' && progress >= 100 && !closureComment.trim() && isEdit) {
      setClosureError(true);
      return;
    }

    if (isEdit && task) {
      // Add closure comment as a task comment
      if (derivedStatus === 'completed' && closureComment.trim() && onAddComment) {
        onAddComment({
          id: task.id,
          comment: {
            id: crypto.randomUUID(),
            employee_id: employeeId,
            employee_name: currentEmployeeName || 'User',
            text: `📋 ${t('workload.tasks.closureComment')}: ${closureComment.trim()}`,
            created_at: new Date().toISOString(),
          },
        });
      }

      onUpdate({
        id: task.id,
        title: data.title,
        description: data.description || null,
        priority: Number(data.priority),
        status: derivedStatus,
        progress,
        estimated_minutes: data.estimated_minutes ? Number(data.estimated_minutes) : null,
        due_date: data.due_date || null,
        scheduled_start: data.scheduled_start || null,
      });
    } else {
      onCreate({
        tenant_id: tenantId,
        employee_id: employeeId,
        title: data.title,
        description: data.description || null,
        priority: Number(data.priority),
        status: 'draft',
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

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !task) return;
    const file = e.target.files[0];
    const success = await uploadEvidence(task.id, employeeId, file);
    if (success) {
      toast.success(t('workload.tasks.evidenceUploaded'));
    } else {
      toast.error(t('workload.tasks.evidenceUploadError'));
    }
    e.target.value = '';
  };

  const handleMarkVerified = () => {
    if (!task) return;
    // Store verification in metadata instead of invalid status
    onUpdate({ id: task.id, metadata: { ...(task.metadata as Record<string, unknown> ?? {}), verified: true } } as UnifiedTaskUpdate);
    toast.success(t('workload.tasks.verified'));
    onOpenChange(false);
  };

  const priorityOptions = [1, 2, 3, 4, 5];
  const comments = task?.comments ?? [];
  const hasApprovedEvidence = evidence.some(e => e.status === 'approved');
  const hasAnyEvidence = evidence.length > 0;
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

        {/* Task metadata for edit mode */}
        {isEdit && task && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
             <Badge variant="outline" className="text-2xs">{t('workload.tasks.source')}: {task.source_type}</Badge>
             {task.created_by && <Badge variant="outline" className="text-2xs">{t('workload.tasks.createdBy')}: {task.created_by}</Badge>}
             <Badge variant="outline" className="text-2xs">{new Date(task.created_at).toLocaleDateString()}</Badge>
          </div>
        )}

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
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/30 text-sm">
                {t(`workload.status.${computeStatus(progress, watchedStatus) === 'todo' ? 'planned' : computeStatus(progress, watchedStatus) === 'in_progress' ? 'inProgress' : computeStatus(progress, watchedStatus) === 'completed' ? 'completed' : computeStatus(progress, watchedStatus) === 'verified' ? 'completed' : 'blocked'}`)}
              </div>
            </div>
          </div>

          {/* Progress Slider */}
          {isEdit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('workload.tasks.progress')}</Label>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <Slider
                value={[progress]}
                onValueChange={([v]) => {
                  setProgress(v);
                  setClosureError(false);
                }}
                max={100}
                step={5}
                disabled={isVerified}
              />
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Blocked toggle */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="blocked-toggle"
                checked={watchedStatus === 'blocked'}
                onChange={(e) => setValue('status', e.target.checked ? 'blocked' : 'draft')}
                className="rounded"
                disabled={isVerified}
              />
              <Label htmlFor="blocked-toggle" className="text-sm text-destructive">{t('workload.status.blocked')}</Label>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t('commandCenter.estMinutes')}</Label>
              <Input type="number" {...register('estimated_minutes')} min={0} disabled={isLocked} />
            </div>
            <div className="space-y-2">
              <Label>{t('workload.tasks.startDate')}</Label>
              <Input type="date" {...register('scheduled_start')} disabled={isLocked} />
            </div>
            <div className="space-y-2">
              <Label>{t('commandCenter.dueDate')}</Label>
              <Input type="date" {...register('due_date')} disabled={isLocked} />
            </div>
          </div>

          {/* Closure Comment - only when completing */}
          {isEdit && progress >= 100 && !isVerified && (
            <div className="space-y-2 border-t pt-3">
              <Label className="flex items-center gap-1.5">
                {t('workload.tasks.closureComment')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={closureComment}
                onChange={(e) => { setClosureComment(e.target.value); setClosureError(false); }}
                placeholder={t('workload.tasks.closureCommentPlaceholder')}
                rows={2}
              />
              {closureError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {t('workload.tasks.closureCommentRequired')}
                </p>
              )}
            </div>
          )}

          {/* Evidence Section */}
          {isEdit && task && (isCompleted || isVerified) && (
            <div className="space-y-2 border-t pt-3">
              <Label className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> {t('workload.tasks.evidence')}
              </Label>
              {evidence.length > 0 ? (
                <div className="space-y-1">
                  {evidence.map(ev => {
                    const fileName = ev.file_url.split('/').pop() || 'file';
                    return (
                      <div key={ev.id} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                        <span className="truncate max-w-[200px]">{fileName}</span>
                        <Badge variant="outline" className={`text-2xs ${ev.status === 'approved' ? 'text-chart-1' : ev.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {ev.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t('workload.tasks.noEvidence')}</p>
              )}
              {!isVerified && (
                <div>
                  <input
                    type="file"
                    id="evidence-upload"
                    className="hidden"
                    onChange={handleEvidenceUpload}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('evidence-upload')?.click()} disabled={uploading}>
                    <Upload className="h-3.5 w-3.5 me-1.5" />
                    {uploading ? '...' : t('workload.tasks.uploadEvidence')}
                  </Button>
                </div>
              )}
              {/* Mark as verified button */}
              {isCompleted && hasApprovedEvidence && (
                <Button type="button" variant="default" size="sm" className="gap-1.5" onClick={handleMarkVerified}>
                  <ShieldCheck className="h-3.5 w-3.5" /> {t('workload.tasks.verified')}
                </Button>
              )}
              {isCompleted && !hasApprovedEvidence && (
                <p className="text-xs text-chart-4 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {hasAnyEvidence ? t('workload.tasks.completedNotVerified') : t('workload.tasks.evidenceRequired')}
                </p>
              )}
            </div>
          )}

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
            {!isVerified && (
              <Button type="submit" disabled={isSubmitting}>{isEdit ? t('common.save') : t('common.create')}</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
