import { useTranslation } from 'react-i18next';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import type { UnifiedTask, UnifiedTaskUpdate } from '@/features/workload/hooks/useUnifiedTasks';

interface TaskDialogFormProps {
  isEdit: boolean;
  isLocked: boolean;
  isVerified: boolean;
  task?: UnifiedTask | null;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  progress: number;
  onProgressChange: (value: number) => void;
  computeStatus: (prog: number, currentStatus: string) => string;
  closureComment: string;
  onClosureCommentChange: (value: string) => void;
  closureError: boolean;
  onClosureErrorClear: () => void;
  onUpdate: (data: UnifiedTaskUpdate) => void;
}

const priorityOptions = [1, 2, 3, 4, 5];

const STATUS_MAP: Record<string, string> = {
  draft: 'planned', open: 'planned', in_progress: 'inProgress',
  under_review: 'underReview', pending_approval: 'pendingApproval',
  completed: 'completed', rejected: 'rejected', archived: 'archived',
};

export function TaskDialogForm({
  isEdit, isLocked, isVerified, task,
  register, watch, setValue,
  progress, onProgressChange, computeStatus,
  closureComment, onClosureCommentChange, closureError, onClosureErrorClear,
  onUpdate,
}: TaskDialogFormProps) {
  const { t } = useTranslation();
  const watchedStatus = watch('status');

  return (
    <>
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
            {t(`workload.status.${STATUS_MAP[computeStatus(progress, watchedStatus)] ?? 'planned'}`)}
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
            onValueChange={([v]) => { onProgressChange(v); onClosureErrorClear(); }}
            max={100} step={5} disabled={isVerified}
          />
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Blocked indicator */}
      {isEdit && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox" id="blocked-toggle"
            checked={!!(task?.metadata as Record<string, unknown>)?.is_blocked}
            onChange={(e) => {
              if (task) {
                onUpdate({ id: task.id, metadata: { ...(task.metadata as Record<string, unknown> ?? {}), is_blocked: e.target.checked } } as UnifiedTaskUpdate);
              }
            }}
            className="rounded" disabled={isVerified}
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

      {/* Closure Comment */}
      {isEdit && progress >= 100 && !isVerified && (
        <div className="space-y-2 border-t pt-3">
          <Label className="flex items-center gap-1.5">
            {t('workload.tasks.closureComment')} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={closureComment}
            onChange={(e) => { onClosureCommentChange(e.target.value); onClosureErrorClear(); }}
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
    </>
  );
}
