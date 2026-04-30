import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOrgTree } from '@/hooks/org/useOrgTree';
import { Loader2, User } from 'lucide-react';
import type { RepresentativeAssignment, DistributeTaskPayload } from '@/features/workload/hooks/useRepresentativeTasks';
import { useRepresentativeTasks } from '@/features/workload';

interface DistributeTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: RepresentativeAssignment[];
  onSubmit: (payload: DistributeTaskPayload) => Promise<unknown>;
  isSubmitting: boolean;
}

export function DistributeTaskDialog({ open, onOpenChange, assignments, onSubmit, isSubmitting }: DistributeTaskDialogProps) {
  const { t } = useTranslation();
  const { divisions, getDepartmentsByDivision, getSitesByDepartment } = useOrgTree();
  const { useEmployeesByScope } = useRepresentativeTasks();

  // Cascading selection state
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Task fields
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('3');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const distributeTaskSchema = z.object({
    selectedEmployeeId: z.string().min(1, 'Employee is required'),
    title: z.string().trim().min(2, 'Title is required'),
    titleAr: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.coerce.number().int().min(1, 'Priority must be between 1 and 5').max(5, 'Priority must be between 1 and 5'),
    estimatedMinutes: z.union([z.string().length(0), z.coerce.number().int().min(1, 'Estimated minutes must be at least 1')]),
  });

  // Get unique division IDs from assignments
  const availableDivisions = useMemo(() => {
    const divisionAssignments = assignments.filter(a => a.scope_type === 'division');
    return divisionAssignments
      .map(a => divisions.find(d => d.id === a.scope_id))
      .filter(Boolean) as typeof divisions;
  }, [assignments, divisions]);

  // Departments filtered by selected division
  const filteredDepartments = useMemo(() => {
    if (!selectedDivisionId) return [];
    return getDepartmentsByDivision(selectedDivisionId);
  }, [selectedDivisionId, getDepartmentsByDivision]);

  // Sections filtered by selected department
  const filteredSections = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return getSitesByDepartment(selectedDepartmentId);
  }, [selectedDepartmentId, getSitesByDepartment]);

  // Employees query
  const { data: employees = [], isPending: employeesLoading } = useEmployeesByScope(
    selectedDepartmentId || undefined,
    selectedSectionId || undefined,
  );

  // Reset cascading on parent change
  useEffect(() => {
    setSelectedDepartmentId('');
    setSelectedSectionId('');
    setSelectedEmployeeId('');
  }, [selectedDivisionId]);

  useEffect(() => {
    setSelectedSectionId('');
    setSelectedEmployeeId('');
  }, [selectedDepartmentId]);

  useEffect(() => {
    setSelectedEmployeeId('');
  }, [selectedSectionId]);

  const handleSubmit = async () => {
    const parsed = distributeTaskSchema.safeParse({
      selectedEmployeeId,
      title,
      titleAr,
      description,
      dueDate,
      priority,
      estimatedMinutes,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        selectedEmployeeId: fieldErrors.selectedEmployeeId?.[0] || '',
        title: fieldErrors.title?.[0] || '',
        priority: fieldErrors.priority?.[0] || '',
        estimatedMinutes: fieldErrors.estimatedMinutes?.[0] || '',
      });
      return;
    }
    setErrors({});
    await onSubmit({
      employee_id: parsed.data.selectedEmployeeId,
      title: parsed.data.title,
      title_ar: titleAr.trim() || undefined,
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      priority: parsed.data.priority,
      estimated_minutes: typeof parsed.data.estimatedMinutes === 'number' ? parsed.data.estimatedMinutes : undefined,
    });
    // Reset
    setTitle('');
    setTitleAr('');
    setDescription('');
    setDueDate('');
    setPriority('3');
    setEstimatedMinutes('');
    setSelectedDivisionId('');
    setSelectedDepartmentId('');
    setSelectedSectionId('');
    setSelectedEmployeeId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('representative.assignTask')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Division */}
          <div className="space-y-2">
            <Label>{t('representative.scopeTypes.division')}</Label>
            <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
              <SelectTrigger><SelectValue placeholder={t('representative.selectDivision')} /></SelectTrigger>
              <SelectContent>
                {availableDivisions.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          {selectedDivisionId && (
            <div className="space-y-2">
              <Label>{t('representative.scopeTypes.department')}</Label>
              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                <SelectTrigger><SelectValue placeholder={t('representative.selectDepartment')} /></SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Section (optional) */}
          {selectedDepartmentId && filteredSections.length > 0 && (
            <div className="space-y-2">
              <Label>{t('representative.scopeTypes.section')} ({t('common.none')})</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger><SelectValue placeholder={t('representative.selectSection')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{t('common.all')}</SelectItem>
                  {filteredSections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee picker */}
          {selectedDepartmentId && (
            <div className="space-y-2">
              <Label>{t('representative.employee')}</Label>
              {employeesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
                </div>
              ) : (
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger><SelectValue placeholder={t('representative.selectEmployee')} /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        <span className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {e.full_name} — {e.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.selectedEmployeeId && <p className="text-sm text-destructive">{errors.selectedEmployeeId}</p>}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>{t('representative.taskTitle')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('representative.taskTitlePlaceholder')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Title AR */}
          <div className="space-y-2">
            <Label>{t('representative.taskTitleAr')}</Label>
            <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl" placeholder={t('representative.taskTitleArPlaceholder')} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('representative.description')}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due date */}
            <div className="space-y-2">
              <Label>{t('representative.dueDate')}</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>{t('representative.priority')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">P1 — {t('representative.priorityHigh')}</SelectItem>
                  <SelectItem value="2">P2</SelectItem>
                  <SelectItem value="3">P3 — {t('representative.priorityNormal')}</SelectItem>
                  <SelectItem value="4">P4</SelectItem>
                  <SelectItem value="5">P5 — {t('representative.priorityLow')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
            </div>
          </div>

          {/* Estimated minutes */}
          <div className="space-y-2">
            <Label>{t('representative.estimatedMinutes')}</Label>
            <Input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} min={1} />
            {errors.estimatedMinutes && <p className="text-sm text-destructive">{errors.estimatedMinutes}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedEmployeeId || !title.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('representative.assign')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
