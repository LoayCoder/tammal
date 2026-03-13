import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import { UnifiedTaskList } from '@/features/workload/components/employee/UnifiedTaskList';
import {
  Search, ListChecks, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import type { UnifiedTask } from '@/features/workload/hooks/useUnifiedTasks';

const STATUSES = ['all', 'draft', 'open', 'in_progress', 'under_review', 'pending_approval', 'completed', 'verified', 'rejected', 'archived'] as const;
const PRIORITY_OPTIONS = [
  { value: 'all', labelKey: '' },
  { value: '0', labelKey: 'tasks.priority.critical' },
  { value: '1', labelKey: 'tasks.priority.high' },
  { value: '2', labelKey: 'tasks.priority.medium' },
  { value: '3', labelKey: 'tasks.priority.low' },
];

interface WorkloadTasksViewProps {
  tasks: UnifiedTask[];
  isPending: boolean;
  onDelete: (id: string) => void;
}

export function WorkloadTasksView({ tasks, isPending, onDelete }: WorkloadTasksViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tab, setTab] = useState('active');

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let result = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter(t => String(t.priority) === priorityFilter);
    return result;
  }, [tasks, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const active = filtered.filter(t => !['completed', 'verified', 'archived'].includes(t.status));
    const completed = filtered.filter(t => t.status === 'completed' || t.status === 'verified');
    const overdue = active.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr);
    return { active, completed, overdue };
  }, [filtered, todayStr]);

  const handleEdit = (task: UnifiedTask) => navigate(`/tasks/${task.id}`);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tasks.searchPlaceholder')}
            className="ps-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s === 'all' ? t('common.allStatuses') : t(`tasks.status.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.value === 'all' ? t('common.allPriorities') : t(p.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabbed list */}
      <Card className="border-0">
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="gap-1.5 text-xs">
                <ListChecks className="h-3.5 w-3.5" />{t('tasks.tabs.active')} ({stats.active.length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />{t('tasks.tabs.overdue')} ({stats.overdue.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />{t('tasks.tabs.completed')} ({stats.completed.length})
              </TabsTrigger>
            </TabsList>
            {(['active', 'overdue', 'completed'] as const).map(key => (
              <TabsContent key={key} value={key}>
                {isPending ? <Skeleton className="h-40" /> : (
                  <UnifiedTaskList
                    tasks={stats[key]}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

