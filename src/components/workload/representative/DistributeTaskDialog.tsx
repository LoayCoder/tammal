import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOrgTree } from '@/hooks/org/useOrgTree';
import { Loader2, Users } from 'lucide-react';
import type { RepresentativeAssignment, DistributeTaskPayload } from '@/hooks/workload/useRepresentativeTasks';

interface DistributeTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: RepresentativeAssignment[];
  onSubmit: (payload: DistributeTaskPayload) => Promise<unknown>;
  isSubmitting: boolean;
}

export function DistributeTaskDialog({ open, onOpenChange, assignments, onSubmit, isSubmitting }: DistributeTaskDialogProps) {
  const { t } = useTranslation();
  const { divisions, departments, sites } = useOrgTree();

  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('3');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  const assignment = assignments.find(a => a.id === selectedAssignment);

  const scopeLabel = useMemo(() => {
    if (!assignment) return '';
    if (assignment.scope_type === 'division') {
      return divisions.find(d => d.id === assignment.scope_id)?.name ?? assignment.scope_id;
    }
    if (assignment.scope_type === 'department') {
      return departments.find(d => d.id === assignment.scope_id)?.name ?? assignment.scope_id;
    }
    if (assignment.scope_type === 'section') {
      return sites.find(s => s.id === assignment.scope_id)?.name ?? assignment.scope_id;
    }
    return '';
  }, [assignment, divisions, departments, sites]);

  const handleSubmit = async () => {
    if (!assignment || !title.trim()) return;
    await onSubmit({
      title: title.trim(),
      title_ar: titleAr.trim() || undefined,
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      priority: parseInt(priority),
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      scope_type: assignment.scope_type,
      scope_id: assignment.scope_id,
    });
    // Reset
    setTitle('');
    setTitleAr('');
    setDescription('');
    setDueDate('');
    setPriority('3');
    setEstimatedMinutes('');
    setSelectedAssignment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('representative.distributeTask')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Scope selector */}
          <div className="space-y-2">
            <Label>{t('representative.scope')}</Label>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger><SelectValue placeholder={t('representative.selectScope')} /></SelectTrigger>
              <SelectContent>
                {assignments.map(a => {
                  let label: string = a.scope_type;
                  if (a.scope_type === 'division') label = divisions.find(d => d.id === a.scope_id)?.name ?? a.scope_id;
                  else if (a.scope_type === 'department') label = departments.find(d => d.id === a.scope_id)?.name ?? a.scope_id;
                  else if (a.scope_type === 'section') label = sites.find(s => s.id === a.scope_id)?.name ?? a.scope_id;
                  return (
                    <SelectItem key={a.id} value={a.id}>
                      {t(`representative.scopeTypes.${a.scope_type}` as const)} — {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {assignment && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {t('representative.willDistributeTo', { scope: scopeLabel })}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>{t('representative.taskTitle')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('representative.taskTitlePlaceholder')} />
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
            </div>
          </div>

          {/* Estimated minutes */}
          <div className="space-y-2">
            <Label>{t('representative.estimatedMinutes')}</Label>
            <Input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} min={1} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !assignment || !title.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('representative.distribute')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
