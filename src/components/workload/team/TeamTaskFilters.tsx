import { useTranslation } from 'react-i18next';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { DepartmentEmployee } from '@/features/workload/hooks/useDepartmentTasks';

export interface TaskFilters {
  status: string;
  priority: string;
  employeeId: string;
  sourceType: string;
  search: string;
}

interface TeamTaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  employees: DepartmentEmployee[];
}

export function TeamTaskFilters({ filters, onChange, employees }: TeamTaskFiltersProps) {
  const { t } = useTranslation();

  const set = (key: keyof TaskFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder={t('common.search')}
        value={filters.search}
        onChange={e => set('search', e.target.value)}
        className="w-48"
      />
      <Select value={filters.status} onValueChange={v => set('status', v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t('teamWorkload.filterByStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          <SelectItem value="todo">{t('workload.tasks.statusTodo')}</SelectItem>
          <SelectItem value="in_progress">{t('workload.tasks.statusInProgress')}</SelectItem>
          <SelectItem value="done">{t('common.done')}</SelectItem>
          <SelectItem value="blocked">{t('workload.tasks.statusBlocked')}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.priority} onValueChange={v => set('priority', v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('teamWorkload.filterByPriority')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          <SelectItem value="1">P1</SelectItem>
          <SelectItem value="2">P2</SelectItem>
          <SelectItem value="3">P3</SelectItem>
          <SelectItem value="4">P4</SelectItem>
          <SelectItem value="5">P5</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.employeeId} onValueChange={v => set('employeeId', v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t('teamWorkload.filterByEmployee')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          {employees.map(e => (
            <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.sourceType} onValueChange={v => set('sourceType', v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t('teamWorkload.filterBySource')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          <SelectItem value="manual">{t('teamWorkload.sourceManual')}</SelectItem>
          <SelectItem value="manager_assigned">{t('teamWorkload.sourceAssigned')}</SelectItem>
          <SelectItem value="okr">{t('teamWorkload.sourceOKR')}</SelectItem>
          <SelectItem value="external">{t('teamWorkload.sourceExternal')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
