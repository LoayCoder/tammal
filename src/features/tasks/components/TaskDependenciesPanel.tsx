import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskDependencies } from '@/features/tasks/hooks/useTaskDependencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        onSuccess: () => {
          setSearch('');
          toast.success(t('dependencies.added'));
        },
        onError: (e: any) => toast.error(e.message),
      },
    );
  };

  if (isPending) return <Skeleton className="h-32" />;

  return (
    <Card className="border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t('dependencies.title')} ({blockers.length + dependents.length})
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3.5 w-3.5 me-1" />{t('dependencies.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasUnresolvedBlockers && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('dependencies.unresolvedBlockers')}
          </div>
        )}

        {/* Add dependency */}
        {showAdd && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
            <div className="flex gap-2">
              <Select value={depType} onValueChange={setDepType}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocks">{t('dependencies.types.blocks')}</SelectItem>
                  <SelectItem value="related">{t('dependencies.types.related')}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('dependencies.searchPlaceholder')}
                className="h-8 text-xs flex-1"
              />
            </div>
            {filteredResults.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredResults.map(task => (
                  <button
                    key={task.id}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-muted text-start text-xs"
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
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t('dependencies.blockedBy')}</span>
            {blockers.map(dep => {
              const task = dep.depends_on_task as any;
              const isResolved = task?.status === 'completed';
              return (
                <div key={dep.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 group">
                  {isResolved ? <CheckCircle className="h-3.5 w-3.5 text-chart-1 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                  <button className="text-xs text-start flex-1 truncate hover:underline" onClick={() => navigate(`/tasks/${task?.id}`)}>
                    {task?.title ?? dep.depends_on_task_id.slice(0, 8)}
                  </button>
                   <Badge variant="outline" className="text-2xs">{dep.dependency_type}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeDependency(dep.id)}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Dependents */}
        {dependents.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t('dependencies.blocking')}</span>
            {dependents.map(dep => {
              const task = dep.dependent_task as any;
              return (
                <div key={dep.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 group">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 rtl:rotate-180" />
                  <button className="text-xs text-start flex-1 truncate hover:underline" onClick={() => navigate(`/tasks/${task?.id}`)}>
                    {task?.title ?? dep.task_id.slice(0, 8)}
                  </button>
                  <Badge variant="outline" className="text-2xs">{dep.dependency_type}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeDependency(dep.id)}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {blockers.length === 0 && dependents.length === 0 && !showAdd && (
          <p className="text-xs text-muted-foreground text-center py-4">{t('dependencies.empty')}</p>
        )}
      </CardContent>
    </Card>
  );
}
