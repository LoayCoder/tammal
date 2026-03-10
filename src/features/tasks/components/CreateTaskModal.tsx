import { useState, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useEnterpriseTasks } from '@/features/tasks/hooks/useEnterpriseTasks';
import { useTenantId } from '@/hooks/org/useTenantId';
import type { ChecklistItem } from './TaskChecklist';
import { TaskPrimaryForm } from './create-modal/TaskPrimaryForm';
import { TaskConfigPanel } from './create-modal/TaskConfigPanel';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName?: string;
  defaultDepartmentId?: string | null;
  defaultInitiativeId?: string | null;
  defaultObjectiveId?: string | null;
}

interface LocalFile { file: File; }

export function CreateTaskModal({
  open, onOpenChange, employeeId, employeeName,
  defaultDepartmentId, defaultInitiativeId, defaultObjectiveId,
}: CreateTaskModalProps) {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const { createTaskAsync, isCreating } = useEnterpriseTasks();
  const formId = useId();

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
        title: title.trim(), title_ar: titleAr.trim() || null,
        description: description.trim() || null, employee_id: assigneeId,
        status: asDraft ? 'draft' : 'open', priority, visibility,
        due_date: dueDate?.toISOString() ?? null, scheduled_start: startDate?.toISOString() ?? null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        department_id: departmentId, initiative_id: defaultInitiativeId ?? null,
        objective_id: defaultObjectiveId ?? null, assignee_id: assigneeId,
        reviewer_id: reviewerId, approver_id: approverId,
        reminder_date: reminderDate?.toISOString() ?? null,
        tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        created_by: employeeId,
      });
      resetForm(); onOpenChange(false);
    } catch {}
  }, [title, titleAr, description, assigneeId, priority, visibility, dueDate, startDate, estimatedMinutes, departmentId, defaultInitiativeId, defaultObjectiveId, reviewerId, approverId, reminderDate, selectedTagIds, employeeId, createTaskAsync, resetForm, onOpenChange]);

  const handleTemplateSelect = useCallback((tpl: any) => {
    setTitle(tpl.title);
    if (tpl.title_ar) setTitleAr(tpl.title_ar);
    if (tpl.description) setDescription(tpl.description);
    if (tpl.priority) setPriority(tpl.priority === 'critical' ? 0 : tpl.priority === 'high' ? 1 : tpl.priority === 'low' ? 3 : 2);
    if (tpl.visibility) setVisibility(tpl.visibility);
    if (tpl.estimated_minutes) setEstimatedMinutes(String(tpl.estimated_minutes));
    if (tpl.department_id) setDepartmentId(tpl.department_id);
    if (tpl.checklist_items?.length) {
      setChecklistItems(tpl.checklist_items.map((item: any, idx: number) => ({
        id: `tpl-${idx}`, title: typeof item === 'string' ? item : item.title || '',
        status: 'pending' as const, sort_order: idx,
      })));
    }
  }, []);

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
          <ScrollArea className="flex-1 p-4 space-y-4 md:border-e">
            <TaskPrimaryForm
              titleId={titleId} titleArId={titleArId} descId={descId}
              title={title} titleAr={titleAr} description={description}
              onTitleChange={setTitle} onTitleArChange={setTitleAr} onDescriptionChange={setDescription}
              checklistItems={checklistItems} onChecklistChange={setChecklistItems}
              files={files} onFilesChange={setFiles} onTemplateSelect={handleTemplateSelect}
            />
          </ScrollArea>

          <ScrollArea className="w-full md:w-80 p-4 space-y-4">
            <TaskConfigPanel
              statusId={statusId} priorityId={priorityId} estMinId={estMinId} visibilityId={visibilityId}
              status={status} priority={priority} visibility={visibility}
              startDate={startDate} dueDate={dueDate} reminderDate={reminderDate}
              estimatedMinutes={estimatedMinutes}
              assigneeId={assigneeId} reviewerId={reviewerId} approverId={approverId}
              departmentId={departmentId} selectedTagIds={selectedTagIds} advancedOpen={advancedOpen}
              onStatusChange={setStatus} onPriorityChange={setPriority} onVisibilityChange={setVisibility}
              onStartDateChange={setStartDate} onDueDateChange={setDueDate} onReminderDateChange={setReminderDate}
              onEstimatedMinutesChange={setEstimatedMinutes}
              onAssigneeChange={setAssigneeId} onReviewerChange={setReviewerId} onApproverChange={setApproverId}
              onTagsChange={setSelectedTagIds} onAdvancedOpenChange={setAdvancedOpen}
            />
          </ScrollArea>
        </div>

        <Separator />

        <DialogFooter className="p-4 pt-3 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>{t('common.cancel')}</Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={isCreating || !title.trim()}>
            <Save className="h-4 w-4 me-1.5" />{t('tasks.saveDraft')}
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isCreating || !title.trim() || !assigneeId}>
            <Send className="h-4 w-4 me-1.5" />{t('tasks.createTask')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
