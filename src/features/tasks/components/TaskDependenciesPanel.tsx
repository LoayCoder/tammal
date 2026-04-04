import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskDependencies } from '@/features/tasks/hooks/useTaskDependencies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, X, Plus, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-chart-1/10 text-chart-1',
  in_progress: 'bg-chart-2/10 text-chart-2',
  open: 'bg-chart-4/10 text-chart-4',
  blocked: 'bg-destructive/10 text-destructive',
};

export function TaskDependenciesPanel({ taskId }: { taskId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { blockers, dependents, isPending, addDependency, removeDependency, isAdding, hasUnresolvedBlockers, useSearchTasks } = useTaskDependencies(taskId);
  const [search, setSearch] = useState('');
  const [depType, setDepType] = useState<string>('blocks');
  const [showAdd, setShowAdd] = useState(false);

  const { data: searchResults = [] } = useSearchTasks(search);

  const existingIds = new Set([...blockers.map(b => b.depends_on_task_id), ...dependents.map(d => d.task_id)]);
  const filteredResults = searchResults.filter(r => !existingIds.has(r.id));

  const handleAdd = (dependsOnId: string) => {
    addDependency(
      { dependsOnTaskId: dependsOnId, type: depType },
      {
        onSuccess: () => { setSearch(''); toast.success(t('dependencies.added')); },
        onError: (e: any) => toast.error(e.message),
      },
    );
  };

  if (isPending) return <Skeleton className="h-12" />;

  const totalDeps = blockers.length + dependents.length;

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs font-medium">{t('dependencies.title')}</span>
          {totalDeps > 0 && <span className="text-2xs text-muted-foreground">({totalDeps})</span>}
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-2xs px-2 text-muted-foreground" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3 me-0.5" />{t('dependencies.add')}
        </Button>
      </div>

      {hasUnresolvedBlockers && (
        <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-destructive/5 text-destructive text-2xs">
          <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
          {t('dependencies.unresolvedBlockers')}
        </div>
      )}

      {/* Add dependency */}
      {showAdd && (
        <div className="space-y-2 ps-6">
          <div className="flex gap-2">
            <Select value={depType} onValueChange={setDepType}>
              <SelectTrigger className="w-[100px] h-7 text-2xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blocks">{t('dependencies.types.blocks')}</SelectItem>
                <SelectItem value="related">{t('dependencies.types.related')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('dependencies.searchPlaceholder')}
              className="h-7 text-2xs flex-1"
            />
          </div>
          {filteredResults.length > 0 && (
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {filteredResults.map(task => (
                <button
                  key={task.id}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/40 text-start text-2xs transition-colors"
                  onClick={() => handleAdd(task.id)}
                  disabled={isAdding}
                >
                  <span className="truncate">{task.title}</span>
                  <Badge className={`${STATUS_BADGE[task.status] ?? 'bg-muted text-muted-foreground'} text-2xs shrink-0`}>{task.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="space-y-0.5 ps-6">
          <span className="text-2xs font-medium text-muted-foreground">{t('dependencies.blockedBy')}</span>
          {blockers.map(dep => {
            const task = dep.depends_on_task as any;
            const isResolved = task?.status === 'completed';
            return (
              <div key={dep.id} className="flex items-center gap-2 py-1 group">
                {isResolved ? <CheckCircle className="h-3 w-3 text-chart-1 shrink-0" strokeWidth={1.5} /> : <AlertTriangle className="h-3 w-3 text-destructive shrink-0" strokeWidth={1.5} />}
                <button className="text-2xs text-start flex-1 truncate hover:underline" onClick={() => navigate(`/tasks/${task?.id}`)}>
                  {task?.title ?? dep.depends_on_task_id.slice(0, 8)}
                </button>
                <Badge variant="outline" className="text-2xs">{dep.dependency_type}</Badge>
                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeDependency(dep.id)}>
                  <X className="h-2.5 w-2.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dependents */}
      {dependents.length > 0 && (
        <div className="space-y-0.5 ps-6">
          <span className="text-2xs font-medium text-muted-foreground">{t('dependencies.blocking')}</span>
          {dependents.map(dep => {
            const task = dep.dependent_task as any;
            return (
              <div key={dep.id} className="flex items-center gap-2 py-1 group">
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 rtl:rotate-180" strokeWidth={1.5} />
                <button className="text-2xs text-start flex-1 truncate hover:underline" onClick={() => navigate(`/tasks/${task?.id}`)}>
                  {task?.title ?? dep.task_id.slice(0, 8)}
                </button>
                <Badge variant="outline" className="text-2xs">{dep.dependency_type}</Badge>
                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeDependency(dep.id)}>
                  <X className="h-2.5 w-2.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {totalDeps === 0 && !showAdd && (
        <p className="text-2xs text-muted-foreground text-center py-3">{t('dependencies.empty')}</p>
      )}
    </div>
  );
}
