import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Lock, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UnifiedTask } from '@/hooks/workload/useUnifiedTasks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UnifiedTaskListProps {
  tasks: UnifiedTask[];
  onEdit: (task: UnifiedTask) => void;
  onDelete: (id: string) => void;
  onToggle: (task: UnifiedTask) => void;
  onStatusChange?: (task: UnifiedTask, status: string) => void;
  onComment?: (task: UnifiedTask) => void;
}

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  manual: { label: 'Manual', className: 'bg-primary/10 text-primary' },
  manager_assigned: { label: 'Assigned', className: 'bg-chart-3/10 text-chart-3' },
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

const STATUS_OPTIONS = ['todo', 'in_progress', 'done', 'blocked'];

export function UnifiedTaskList({ tasks, onEdit, onDelete, onToggle, onStatusChange, onComment }: UnifiedTaskListProps) {
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
        const isDone = task.status === 'done';
        const source = SOURCE_LABELS[task.source_type] ?? SOURCE_LABELS.manual;
        const priorityClass = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS[3];
        const isLocked = task.is_locked;
        const commentCount = task.comments?.length ?? 0;

        return (
          <div key={task.id} className={`flex items-start gap-3 px-1 py-3 group ${isDone ? 'opacity-60' : ''}`}>
            <Checkbox
              checked={isDone}
              onCheckedChange={() => onToggle(task)}
              className="mt-1 shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${isDone ? 'line-through' : ''}`}>{task.title}</span>
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
                {commentCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                    <MessageSquare className="h-3 w-3" />{commentCount}
                  </Badge>
                )}
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {task.estimated_minutes && <span>{task.estimated_minutes}m</span>}
                {task.due_date && <span>{new Date(task.due_date).toLocaleDateString()}</span>}
                {/* Inline status change for locked tasks */}
                {isLocked && onStatusChange && (
                  <Select value={task.status} onValueChange={(v) => onStatusChange(task, v)}>
                    <SelectTrigger className="h-6 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{t(`workload.status.${s === 'todo' ? 'planned' : s === 'in_progress' ? 'inProgress' : s === 'done' ? 'completed' : 'blocked'}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isLocked && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="h-3.5 w-3.5 me-2" />{t('common.edit')}
                  </DropdownMenuItem>
                )}
                {onComment && (
                  <DropdownMenuItem onClick={() => onComment(task)}>
                    <MessageSquare className="h-3.5 w-3.5 me-2" />{t('workload.comments.add')}
                  </DropdownMenuItem>
                )}
                {task.external_url && (
                  <DropdownMenuItem asChild>
                    <a href={task.external_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 me-2" />{t('commandCenter.openExternal')}
                    </a>
                  </DropdownMenuItem>
                )}
                {!isLocked && (
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task.id)}>
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
