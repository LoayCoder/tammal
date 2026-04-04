import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Lock, MessageSquare, CheckCircle2, ShieldCheck, CalendarDays, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { UnifiedTask } from '@/features/workload/hooks/useUnifiedTasks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UnifiedTaskListProps {
  tasks: UnifiedTask[];
  onEdit: (task: UnifiedTask) => void;
  onDelete: (id: string) => void;
  onComment?: (task: UnifiedTask) => void;
}

const PRIORITY_DOT: Record<number, string> = {
  1: 'bg-destructive',
  2: 'bg-chart-4',
  3: 'bg-muted-foreground',
  4: 'bg-chart-1',
  5: 'bg-muted-foreground/50',
};

const PRIORITY_LABEL: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
  5: 'None',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'text-muted-foreground',
  open: 'text-chart-2',
  in_progress: 'text-primary',
  under_review: 'text-chart-4',
  pending_approval: 'text-chart-5',
  completed: 'text-chart-1',
  rejected: 'text-destructive',
  archived: 'text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  in_progress: 'In Progress',
  under_review: 'Review',
  pending_approval: 'Pending',
  completed: 'Done',
  rejected: 'Rejected',
  archived: 'Archived',
};

export function UnifiedTaskList({ tasks, onEdit, onDelete, onComment }: UnifiedTaskListProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">{t('commandCenter.noTasks')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => {
        const isCompleted = task.status === 'completed';
        const isVerified = !!(task.metadata as Record<string, unknown>)?.verified;
        const isLocked = task.is_locked;
        const commentCount = task.comments?.length ?? 0;
        const priorityDot = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT[3];
        const statusColor = STATUS_COLOR[task.status] ?? STATUS_COLOR.draft;
        const statusLabel = STATUS_LABEL[task.status] ?? 'Draft';

        const title = isAr ? (task.title_ar || task.title) : task.title;
        const desc = isAr ? ((task as any).description_ar || task.description) : task.description;

        // Composite ID
        const tenantName = (task as any).tenant?.name;
        const branchName = (task as any).employee?.branch?.name;
        const year = task.created_at ? new Date(task.created_at).getFullYear().toString().slice(-2) : '';
        const compositeId = tenantName && branchName && task.task_number
          ? `${tenantName} - ${branchName} - ${task.task_number} - ${year}`
          : task.task_number ? `#${task.task_number}` : null;

        return (
          <div
            key={task.id}
            className={`group relative rounded-xl px-4 py-3.5 cursor-pointer transition-all duration-200 hover:bg-muted/10 hover:shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)] ${isCompleted ? 'opacity-50' : ''}`}
            onClick={() => onEdit(task)}
          >
            <div className="flex items-start gap-3">
              {/* Status indicator */}
              <div className="mt-1.5 shrink-0">
                {isVerified ? (
                  <ShieldCheck className="h-4.5 w-4.5 text-primary" strokeWidth={1.75} />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-chart-1" strokeWidth={1.75} />
                ) : (
                  <div className={`h-2.5 w-2.5 rounded-full ${priorityDot} mt-0.5`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold leading-snug ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    dir={isAr ? 'rtl' : 'ltr'}
                  >
                    {title}
                  </span>
                  {isLocked && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock className="h-3 w-3 text-chart-4" strokeWidth={1.75} />
                      </TooltipTrigger>
                      <TooltipContent>{t('workload.lock.locked')}</TooltipContent>
                    </Tooltip>
                  )}
                  {commentCount > 0 && (
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" strokeWidth={1.75} />
                      <span className="text-2xs">{commentCount}</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                {desc && (
                  <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5 leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>
                    {desc}
                  </p>
                )}

                {/* Progress bar */}
                {task.progress > 0 && !isVerified && !isCompleted && (
                  <Progress value={task.progress} className="h-1 mt-2 [&>div]:bg-primary/60" />
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {/* Status pill */}
                  <span className={`text-2xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>

                  {/* Priority label */}
                  <span className="text-2xs text-muted-foreground">
                    P{task.priority} · {PRIORITY_LABEL[task.priority] ?? 'Medium'}
                  </span>

                  {/* Composite ID */}
                  {compositeId && (
                    <span
                      className="text-2xs text-muted-foreground/60 tabular-nums cursor-pointer hover:text-foreground transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(compositeId); toast.success(t('common.copied')); }}
                    >
                      {compositeId}
                    </span>
                  )}

                  <span className="flex-1" />

                  {/* Time info */}
                  {task.estimated_minutes && (
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground/60">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />{task.estimated_minutes}m
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`flex items-center gap-1 text-2xs ${task.due_date.split('T')[0] < new Date().toISOString().split('T')[0] && !isCompleted ? 'text-destructive font-medium' : 'text-muted-foreground/60'}`}>
                      <CalendarDays className="h-3 w-3" strokeWidth={1.75} />
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                    <Pencil className="h-3.5 w-3.5 me-2" />{t('common.edit')}
                  </DropdownMenuItem>
                  {onComment && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComment(task); }}>
                      <MessageSquare className="h-3.5 w-3.5 me-2" />{t('workload.comments.add')}
                    </DropdownMenuItem>
                  )}
                  {task.external_url && (
                    <DropdownMenuItem asChild>
                      <a href={task.external_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3.5 w-3.5 me-2" />{t('commandCenter.openExternal')}
                      </a>
                    </DropdownMenuItem>
                  )}
                  {!isLocked && (
                    <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
                      <Trash2 className="h-3.5 w-3.5 me-2" />{t('common.delete')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
