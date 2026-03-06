import { useState, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CalendarIcon, Clock, Save, Send, Bell, ChevronDown, Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useEnterpriseTasks } from '@/features/tasks/hooks/useEnterpriseTasks';
import { useTenantId } from '@/hooks/org/useTenantId';
import { TaskChecklist, type ChecklistItem } from './TaskChecklist';
import { TaskTagPicker } from './TaskTagPicker';
import { TaskMembersPicker } from './TaskMembersPicker';
import { TaskAttachments } from './TaskAttachments';
import { TaskTemplatePicker } from './TaskTemplatePicker';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName?: string;
  defaultDepartmentId?: string | null;
  defaultInitiativeId?: string | null;
  defaultObjectiveId?: string | null;
}

const STATUSES = ['draft', 'open'] as const;
const PRIORITIES = [
  { value: 0, label: 'tasks.priority.critical', color: 'text-destructive' },
  { value: 1, label: 'tasks.priority.high', color: 'text-chart-5' },
  { value: 2, label: 'tasks.priority.medium', color: 'text-chart-4' },
  { value: 3, label: 'tasks.priority.low', color: 'text-muted-foreground' },
];
const VISIBILITIES = ['private', 'department', 'cross_department', 'organization'] as const;

interface LocalFile { file: File; }

export function CreateTaskModal({
  open, onOpenChange, employeeId, employeeName,
  defaultDepartmentId, defaultInitiativeId, defaultObjectiveId,
}: CreateTaskModalProps) {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const { createTaskAsync, isCreating } = useEnterpriseTasks();
  const formId = useId();

  // Form state
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [priority, setPriority] = useState(2);
  const [visibility, setVisibility] = useState<string>('department');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string | null>(employeeId);
  const [reviewerId, setReviewerId] = useState<string | null>(null);
  const [approverId, setApproverId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(defaultDepartmentId ?? null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const resetForm = useCallback(() => {
    setTitle(''); setTitleAr(''); setDescription(''); setStatus('draft');
    setPriority(2); setVisibility('department'); setDueDate(undefined);
    setStartDate(undefined); setReminderDate(undefined); setEstimatedMinutes('');
    setAssigneeId(employeeId); setReviewerId(null); setApproverId(null);
    setDepartmentId(defaultDepartmentId ?? null); setChecklistItems([]);
    setSelectedTagIds([]); setFiles([]); setAdvancedOpen(false);
  }, [employeeId, defaultDepartmentId]);

  const handleSubmit = useCallback(async (asDraft: boolean) => {
    if (!title.trim() || !assigneeId) return;
    try {
      await createTaskAsync({
        title: title.trim(),
        title_ar: titleAr.trim() || null,
        description: description.trim() || null,
        employee_id: assigneeId,
        status: asDraft ? 'draft' : 'open',
        priority,
        visibility,
        due_date: dueDate?.toISOString() ?? null,
        scheduled_start: startDate?.toISOString() ?? null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        department_id: departmentId,
        initiative_id: defaultInitiativeId ?? null,
        objective_id: defaultObjectiveId ?? null,
        assignee_id: assigneeId,
        reviewer_id: reviewerId,
        approver_id: approverId,
        reminder_date: reminderDate?.toISOString() ?? null,
        tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        created_by: employeeId,
      });
      resetForm();
      onOpenChange(false);
    } catch {}
  }, [title, titleAr, description, assigneeId, priority, visibility, dueDate, startDate, estimatedMinutes, departmentId, defaultInitiativeId, defaultObjectiveId, reviewerId, approverId, reminderDate, selectedTagIds, employeeId, createTaskAsync, resetForm, onOpenChange]);

  // Generate unique IDs for accessibility
  const titleId = `${formId}-title`;
  const titleArId = `${formId}-title-ar`;
  const descId = `${formId}-desc`;
  const statusId = `${formId}-status`;
  const priorityId = `${formId}-priority`;
  const estMinId = `${formId}-est-min`;
  const visibilityId = `${formId}-visibility`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg">{t('tasks.createTask')}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {t('tasks.createdBy')}: {employeeName || t('common.unknown')} • {format(new Date(), 'dd MMM yyyy • HH:mm')}
          </p>
        </DialogHeader>

        <Separator />

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Panel - Primary Info */}
          <ScrollArea className="flex-1 p-4 space-y-4 md:border-e">
            <div className="space-y-4">
              <TaskTemplatePicker onSelect={(tpl) => {
                setTitle(tpl.title);
                if (tpl.title_ar) setTitleAr(tpl.title_ar);
                if (tpl.description) setDescription(tpl.description);
                if (tpl.priority) setPriority(tpl.priority === 'critical' ? 0 : tpl.priority === 'high' ? 1 : tpl.priority === 'low' ? 3 : 2);
                if (tpl.visibility) setVisibility(tpl.visibility);
                if (tpl.estimated_minutes) setEstimatedMinutes(String(tpl.estimated_minutes));
                if (tpl.department_id) setDepartmentId(tpl.department_id);
                if (tpl.checklist_items?.length) {
                  setChecklistItems(tpl.checklist_items.map((item: any, idx: number) => ({
                    id: `tpl-${idx}`,
                    title: typeof item === 'string' ? item : item.title || '',
                    status: 'pending' as const,
                    sort_order: idx,
                  })));
                }
              }} />
              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor={titleId}>{t('tasks.fields.title')} *</Label>
                <Input
                  id={titleId}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('tasks.fields.titlePlaceholder')}
                  aria-required="true"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={titleArId}>{t('tasks.fields.titleAr')}</Label>
                <Input
                  id={titleArId}
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder={t('tasks.fields.titleArPlaceholder')}
                  dir="rtl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={descId}>{t('tasks.fields.description')}</Label>
                <Textarea
                  id={descId}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('tasks.fields.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <TaskAttachments files={files} onChange={setFiles} />

              <TaskChecklist items={checklistItems} onChange={setChecklistItems} />
            </div>
          </ScrollArea>

          {/* Right Panel - Configuration */}
          <ScrollArea className="w-full md:w-80 p-4 space-y-4">
            <div className="space-y-4">
              {/* Status */}
              <div className="space-y-1.5">
                <Label htmlFor={statusId}>{t('tasks.fields.status')}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id={statusId}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{t(`tasks.status.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label htmlFor={priorityId}>{t('tasks.fields.priority')}</Label>
                <Select value={String(priority)} onValueChange={(v) => setPriority(Number(v))}>
                  <SelectTrigger id={priorityId}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={String(p.value)}>
                        <span className={p.color}>{t(p.label)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Members */}
              <TaskMembersPicker
                assigneeId={assigneeId}
                reviewerId={reviewerId}
                approverId={approverId}
                onAssigneeChange={setAssigneeId}
                onReviewerChange={setReviewerId}
                onApproverChange={setApproverId}
                departmentId={departmentId}
              />

              <Separator />

              {/* Dates */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {t('tasks.fields.startDate')}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-start font-normal h-9 text-sm" aria-label={startDate ? `${t('tasks.fields.startDate')}: ${format(startDate, 'PPP')}` : t('tasks.fields.startDate')}>
                        {startDate ? format(startDate, 'PPP') : t('tasks.fields.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {t('tasks.fields.dueDate')}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-start font-normal h-9 text-sm" aria-label={dueDate ? `${t('tasks.fields.dueDate')}: ${format(dueDate, 'PPP')}` : t('tasks.fields.dueDate')}>
                        {dueDate ? format(dueDate, 'PPP') : t('tasks.fields.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} /></PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={estMinId} className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {t('tasks.fields.estimatedMinutes')}
                  </Label>
                  <Input
                    id={estMinId}
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="60"
                    className="h-9"
                    min={0}
                    aria-label={t('tasks.fields.estimatedMinutes')}
                  />
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <TaskTagPicker selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

              <Separator />

              {/* Advanced Settings */}
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      {t('tasks.advancedSettings')}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-3">
                  {/* Visibility */}
                  <div className="space-y-1.5">
                    <Label htmlFor={visibilityId}>{t('tasks.fields.visibility')}</Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger id={visibilityId}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VISIBILITIES.map(v => (
                          <SelectItem key={v} value={v}>{t(`tasks.visibility.${v}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reminder Date */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5" />
                      {t('tasks.fields.reminderDate')}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-start font-normal h-9 text-sm" aria-label={reminderDate ? `${t('tasks.fields.reminderDate')}: ${format(reminderDate, 'PPP')}` : t('tasks.fields.reminderDate')}>
                          {reminderDate ? format(reminderDate, 'PPP') : t('tasks.fields.selectDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">{t('tasks.reminderHint')}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <DialogFooter className="p-4 pt-3 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            {t('common.cancel')}
          </Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={isCreating || !title.trim()}>
            <Save className="h-4 w-4 me-1.5" />
            {t('tasks.saveDraft')}
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isCreating || !title.trim() || !assigneeId}>
            <Send className="h-4 w-4 me-1.5" />
            {t('tasks.createTask')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
