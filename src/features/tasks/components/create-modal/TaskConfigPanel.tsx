import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Bell, ChevronDown, Settings2 } from 'lucide-react';
import { TaskTagPicker } from '../TaskTagPicker';
import { TaskMembersPicker } from '../TaskMembersPicker';

const STATUSES = ['draft', 'open'] as const;
const PRIORITIES = [
  { value: 0, label: 'tasks.priority.critical', color: 'text-destructive' },
  { value: 1, label: 'tasks.priority.high', color: 'text-chart-5' },
  { value: 2, label: 'tasks.priority.medium', color: 'text-chart-4' },
  { value: 3, label: 'tasks.priority.low', color: 'text-muted-foreground' },
];
const VISIBILITIES = ['private', 'department', 'cross_department', 'organization'] as const;

interface TaskConfigPanelProps {
  statusId: string;
  priorityId: string;
  estMinId: string;
  visibilityId: string;
  status: string;
  priority: number;
  visibility: string;
  startDate?: Date;
  dueDate?: Date;
  reminderDate?: Date;
  estimatedMinutes: string;
  assigneeId: string | null;
  reviewerId: string | null;
  approverId: string | null;
  departmentId: string | null;
  selectedTagIds: string[];
  advancedOpen: boolean;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: number) => void;
  onVisibilityChange: (v: string) => void;
  onStartDateChange: (d: Date | undefined) => void;
  onDueDateChange: (d: Date | undefined) => void;
  onReminderDateChange: (d: Date | undefined) => void;
  onEstimatedMinutesChange: (v: string) => void;
  onAssigneeChange: (v: string | null) => void;
  onReviewerChange: (v: string | null) => void;
  onApproverChange: (v: string | null) => void;
  onTagsChange: (ids: string[]) => void;
  onAdvancedOpenChange: (v: boolean) => void;
}

export function TaskConfigPanel({
  statusId, priorityId, estMinId, visibilityId,
  status, priority, visibility,
  startDate, dueDate, reminderDate, estimatedMinutes,
  assigneeId, reviewerId, approverId, departmentId,
  selectedTagIds, advancedOpen,
  onStatusChange, onPriorityChange, onVisibilityChange,
  onStartDateChange, onDueDateChange, onReminderDateChange,
  onEstimatedMinutesChange,
  onAssigneeChange, onReviewerChange, onApproverChange,
  onTagsChange, onAdvancedOpenChange,
}: TaskConfigPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={statusId}>{t('tasks.fields.status')}</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id={statusId}><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{t(`tasks.status.${s}`)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={priorityId}>{t('tasks.fields.priority')}</Label>
        <Select value={String(priority)} onValueChange={(v) => onPriorityChange(Number(v))}>
          <SelectTrigger id={priorityId}><SelectValue /></SelectTrigger>
          <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={String(p.value)}><span className={p.color}>{t(p.label)}</span></SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Separator />

      <TaskMembersPicker assigneeId={assigneeId} reviewerId={reviewerId} approverId={approverId} onAssigneeChange={onAssigneeChange} onReviewerChange={onReviewerChange} onApproverChange={onApproverChange} departmentId={departmentId} />

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />{t('tasks.fields.startDate')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-start font-normal h-9 text-sm" aria-label={startDate ? `${t('tasks.fields.startDate')}: ${format(startDate, 'PPP')}` : t('tasks.fields.startDate')}>
                {startDate ? format(startDate, 'PPP') : t('tasks.fields.selectDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={onStartDateChange} /></PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />{t('tasks.fields.dueDate')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-start font-normal h-9 text-sm" aria-label={dueDate ? `${t('tasks.fields.dueDate')}: ${format(dueDate, 'PPP')}` : t('tasks.fields.dueDate')}>
                {dueDate ? format(dueDate, 'PPP') : t('tasks.fields.selectDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={onDueDateChange} /></PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={estMinId} className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{t('tasks.fields.estimatedMinutes')}</Label>
          <Input id={estMinId} type="number" value={estimatedMinutes} onChange={(e) => onEstimatedMinutesChange(e.target.value)} placeholder="60" className="h-9" min={0} aria-label={t('tasks.fields.estimatedMinutes')} />
        </div>
      </div>

      <Separator />

      <TaskTagPicker selectedTagIds={selectedTagIds} onChange={onTagsChange} />

      <Separator />

      <Collapsible open={advancedOpen} onOpenChange={onAdvancedOpenChange}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-1.5"><Settings2 className="h-3.5 w-3.5" />{t('tasks.advancedSettings')}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <Label htmlFor={visibilityId}>{t('tasks.fields.visibility')}</Label>
            <Select value={visibility} onValueChange={onVisibilityChange}>
              <SelectTrigger id={visibilityId}><SelectValue /></SelectTrigger>
              <SelectContent>{VISIBILITIES.map(v => <SelectItem key={v} value={v}>{t(`tasks.visibility.${v}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" />{t('tasks.fields.reminderDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-start font-normal h-9 text-sm" aria-label={reminderDate ? `${t('tasks.fields.reminderDate')}: ${format(reminderDate, 'PPP')}` : t('tasks.fields.reminderDate')}>
                  {reminderDate ? format(reminderDate, 'PPP') : t('tasks.fields.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reminderDate} onSelect={onReminderDateChange} /></PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">{t('tasks.reminderHint')}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
