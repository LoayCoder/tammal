import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { DepartmentEmployee } from '@/features/workload/hooks/useDepartmentTasks';

interface AddTeamTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: DepartmentEmployee[];
  tenantId: string;
  createdBy: string;
  onSubmit: (task: {
    tenant_id: string;
    employee_id: string;
    title: string;
    title_ar?: string | null;
    description?: string | null;
    estimated_minutes?: number | null;
    due_date?: string | null;
    priority?: number;
    created_by?: string | null;
    source_type?: string;
  }) => void;
  isCreating: boolean;
}

export function AddTeamTaskDialog({
  open, onOpenChange, employees, tenantId, createdBy, onSubmit, isCreating,
}: AddTeamTaskDialogProps) {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState('');
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('3');

  const reset = () => {
    setEmployeeId('');
    setTitle('');
    setTitleAr('');
    setDescription('');
    setEstimatedMinutes('');
    setDueDate('');
    setPriority('3');
  };

  const handleSubmit = () => {
    if (!employeeId || !title) return;
    onSubmit({
      tenant_id: tenantId,
      employee_id: employeeId,
      title,
      title_ar: titleAr || null,
      description: description || null,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      due_date: dueDate || null,
      priority: parseInt(priority),
      created_by: createdBy,
      source_type: 'manager_assigned',
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('teamWorkload.assignTask')}</DialogTitle>
          <DialogDescription>{t('teamWorkload.assignTaskDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('teamWorkload.assignTo')}</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder={t('teamWorkload.selectEmployee')} />
              </SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('workload.tasks.title')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('workload.tasks.titleAr')}</Label>
            <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('workload.tasks.description')}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t('workload.tasks.priority')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(p => (
                    <SelectItem key={p} value={String(p)}>P{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('workload.tasks.estimatedMinutes')}</Label>
              <Input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('workload.tasks.dueDate')}</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!employeeId || !title || isCreating}>
            {t('teamWorkload.assignTask')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
