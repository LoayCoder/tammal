import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Lock, MessageSquare, CheckCircle2, ShieldCheck, CalendarDays, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { UnifiedTask } from '@/hooks/workload/useUnifiedTasks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UnifiedTaskListProps {
  tasks: UnifiedTask[];
  onEdit: (task: UnifiedTask) => void;
  onDelete: (id: string) => void;
  onComment?: (task: UnifiedTask) => void;
}

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  manual: { label: 'Manual', className: 'bg-primary/10 text-primary' },
  enterprise: { label: 'Enterprise', className: 'bg-chart-5/10 text-chart-5' },
  manager_assigned: { label: 'Assigned', className: 'bg-chart-3/10 text-chart-3' },
  representative_assigned: { label: 'Rep. Assigned', className: 'bg-chart-5/10 text-chart-5' },
  objective: { label: 'OKR', className: 'bg-chart-1/10 text-chart-1' },
  external: { label: 'External', className: 'bg-chart-2/10 text-chart-2' },
  observation: { label: 'Observation', className: 'bg-chart-4/10 text-chart-4' },
  incident: { label: 'Incident', className: 'bg-destructive/10 text-destructive' },
  survey_action: { label: 'Survey', className: 'bg-chart-3/10 text-chart-3' },
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-destructive/10 text-destructive',
  2: 'bg-chart-4/10 text-chart-4',
  3: 'bg-muted text-muted-foreground',
  4: 'bg-chart-1/10 text-chart-1',
  5: 'bg-secondary text-secondary-foreground',
};

const STATUS_BADGE: Record<string, { className: string; icon: typeof CheckCircle2 | null; label: string }> = {
  draft: { className: 'bg-muted text-muted-foreground', icon: null, label: 'Draft' },
  open: { className: 'bg-chart-2/10 text-chart-2', icon: null, label: 'Open' },
  todo: { className: 'bg-muted text-muted-foreground', icon: null, label: 'Planned' },
  in_progress: { className: 'bg-chart-2/10 text-chart-2', icon: null, label: 'In Progress' },
  under_review: { className: 'bg-chart-4/10 text-chart-4', icon: null, label: 'Under Review' },
  pending_approval: { className: 'bg-chart-5/10 text-chart-5', icon: null, label: 'Pending Approval' },
  completed: { className: 'bg-chart-1/10 text-chart-1', icon: CheckCircle2, label: 'Completed' },
  verified: { className: 'bg-primary/10 text-primary', icon: ShieldCheck, label: 'Verified' },
  rejected: { className: 'bg-destructive/10 text-destructive', icon: null, label: 'Rejected' },
  blocked: { className: 'bg-destructive/10 text-destructive', icon: null, label: 'Blocked' },
  archived: { className: 'bg-muted text-muted-foreground', icon: null, label: 'Archived' },
};

export function UnifiedTaskList({ tasks, onEdit, onDelete, onComment }: UnifiedTaskListProps) {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{t('commandCenter.noTasks')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {tasks.map((task) => {
        const isCompleted = task.status === 'completed' || task.status === 'verified';
        const source = SOURCE_LABELS[task.source_type] ?? SOURCE_LABELS.manual;
        const priorityClass = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS[3];
        const isLocked = task.is_locked;
        const commentCount = task.comments?.length ?? 0;
        const statusInfo = STATUS_BADGE[task.status] ?? STATUS_BADGE.todo;
        const StatusIcon = statusInfo.icon;

        return (
          <div
            key={task.id}
            className={`flex items-start gap-3 px-1 py-3 group cursor-pointer hover:bg-muted/30 rounded-lg transition-colors ${isCompleted ? 'opacity-60' : ''}`}
            onClick={() => onEdit(task)}
          >
            {/* Progress circle */}
            <div className="mt-1 shrink-0 flex flex-col items-center gap-0.5">
              <div className="relative h-9 w-9 rounded-full border-2 border-border flex items-center justify-center text-[10px] font-bold">
                {task.status === 'verified' ? (
                  <ShieldCheck className="h-4 w-4 text-primary" />
                ) : task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-chart-1" />
                ) : (
                  <span className="text-muted-foreground">{task.progress}%</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${isCompleted ? 'line-through' : ''}`}>{task.title}</span>
                {isLocked && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Lock className="h-3.5 w-3.5 text-chart-4" />
                    </TooltipTrigger>
                    <TooltipContent>{t('workload.lock.locked')}</TooltipContent>
                  </Tooltip>
                )}
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${source.className}`}>
                  {source.label}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityClass}`}>
                  P{task.priority}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-0.5 ${statusInfo.className}`}>
                  {StatusIcon && <StatusIcon className="h-3 w-3" />}
                  {statusInfo.label}
                </Badge>
                {commentCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                    <MessageSquare className="h-3 w-3" />{commentCount}
                  </Badge>
                )}
              </div>

              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
              )}

              {/* Progress bar */}
              {task.progress > 0 && task.status !== 'verified' && (
                <Progress value={task.progress} className="h-1.5" />
              )}

              {/* Metadata row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {task.estimated_minutes && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimated_minutes}m</span>
                )}
                {task.scheduled_start && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(task.scheduled_start).toLocaleDateString()}
                  </span>
                )}
                {task.due_date && (
                  <span className={`flex items-center gap-1 ${task.due_date.split('T')[0] < new Date().toISOString().split('T')[0] && task.status !== 'completed' && task.status !== 'verified' ? 'text-destructive font-medium' : ''}`}>
                    → {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
        );
      })}
    </div>
  );
}
