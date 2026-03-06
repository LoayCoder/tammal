import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw, Pencil, Trash2, Clock, Calendar } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRecurringTasks } from '@/features/tasks/hooks/useRecurringTasks';

const PATTERNS = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'] as const;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

interface TemplateForm {
  title: string;
  title_ar: string;
  description: string;
  priority: string;
  recurrence_pattern: string;
  recurrence_day_of_week: number | null;
  recurrence_day_of_month: number | null;
  recurrence_time: string;
  estimated_minutes: number;
}

const defaultForm: TemplateForm = {
  title: '', title_ar: '', description: '', priority: 'medium',
  recurrence_pattern: 'weekly', recurrence_day_of_week: 0,
  recurrence_day_of_month: 1, recurrence_time: '09:00', estimated_minutes: 60,
};

export default function RecurringTasks() {
  const { t } = useTranslation();
  const { templates, isPending, employee, tenantId, upsertTemplate, toggleActive, softDelete } = useRecurringTasks();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(defaultForm);

  const upsert = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const nextRun = calculateNextRun(form.recurrence_pattern, form.recurrence_day_of_week, form.recurrence_day_of_month, form.recurrence_time, now);

      const payload: any = {
        tenant_id: tenantId!,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        priority: form.priority,
        recurrence_pattern: form.recurrence_pattern,
        recurrence_day_of_week: ['weekly', 'biweekly'].includes(form.recurrence_pattern) ? form.recurrence_day_of_week : null,
        recurrence_day_of_month: ['monthly', 'quarterly'].includes(form.recurrence_pattern) ? form.recurrence_day_of_month : null,
        recurrence_time: form.recurrence_time,
        estimated_minutes: form.estimated_minutes,
        next_run_at: nextRun.toISOString(),
        created_by: employee?.id,
        assignee_id: employee?.id,
        updated_at: now.toISOString(),
      };

      if (editId) {
        const { error } = await supabase.from('task_templates').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('task_templates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success(editId ? t('common.save') : t('common.create'));
      setOpen(false);
      setEditId(null);
      setForm(defaultForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('task_templates').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-templates'] }),
  });

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_templates').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success(t('common.delete'));
    },
  });

  const openEdit = (tpl: any) => {
    setEditId(tpl.id);
    setForm({
      title: tpl.title, title_ar: tpl.title_ar || '', description: tpl.description || '',
      priority: tpl.priority, recurrence_pattern: tpl.recurrence_pattern,
      recurrence_day_of_week: tpl.recurrence_day_of_week, recurrence_day_of_month: tpl.recurrence_day_of_month,
      recurrence_time: tpl.recurrence_time || '09:00', estimated_minutes: tpl.estimated_minutes || 60,
    });
    setOpen(true);
  };

  const patternLabel = (p: string) => t(`recurringTasks.patterns.${p}`);
  const priorityColor = (p: string) => {
    const map: Record<string, string> = { critical: 'destructive', high: 'destructive', medium: 'secondary', low: 'outline' };
    return (map[p] || 'secondary') as any;
  };

  if (isPending) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('recurringTasks.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('recurringTasks.subtitle')}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(defaultForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-2" />{t('recurringTasks.create')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? t('recurringTasks.edit') : t('recurringTasks.create')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>{t('recurringTasks.taskTitle')}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>{t('recurringTasks.taskTitleAr')}</Label><Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
              <div><Label>{t('recurringTasks.description')}</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('recurringTasks.priority')}</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('recurringTasks.pattern')}</Label>
                  <Select value={form.recurrence_pattern} onValueChange={v => setForm(f => ({ ...f, recurrence_pattern: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PATTERNS.map(p => <SelectItem key={p} value={p}>{patternLabel(p)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {['weekly', 'biweekly'].includes(form.recurrence_pattern) && (
                <div>
                  <Label>{t('recurringTasks.dayOfWeek')}</Label>
                  <Select value={String(form.recurrence_day_of_week ?? 0)} onValueChange={v => setForm(f => ({ ...f, recurrence_day_of_week: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {['monthly', 'quarterly'].includes(form.recurrence_pattern) && (
                <div>
                  <Label>{t('recurringTasks.dayOfMonth')}</Label>
                  <Input type="number" min={1} max={28} value={form.recurrence_day_of_month ?? 1} onChange={e => setForm(f => ({ ...f, recurrence_day_of_month: Number(e.target.value) }))} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('recurringTasks.time')}</Label><Input type="time" value={form.recurrence_time} onChange={e => setForm(f => ({ ...f, recurrence_time: e.target.value }))} /></div>
                <div><Label>{t('recurringTasks.estimatedMinutes')}</Label><Input type="number" min={5} value={form.estimated_minutes} onChange={e => setForm(f => ({ ...f, estimated_minutes: Number(e.target.value) }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.title || upsert.isPending}>{editId ? t('common.save') : t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!templates?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t('recurringTasks.empty')}</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((tpl: any) => (
            <Card key={tpl.id}>
              <CardContent className="flex items-center justify-between p-5 flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground truncate">{tpl.title}</span>
                    <Badge variant={priorityColor(tpl.priority)}>{tpl.priority}</Badge>
                    <Badge variant={tpl.is_active ? 'default' : 'outline'}>{tpl.is_active ? t('recurringTasks.active') : t('recurringTasks.paused')}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{patternLabel(tpl.recurrence_pattern)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tpl.recurrence_time?.slice(0, 5) || '09:00'}</span>
                    {tpl.next_run_at && <span>{t('recurringTasks.nextRun')}: {format(new Date(tpl.next_run_at), 'MMM dd, HH:mm')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={tpl.is_active} onCheckedChange={v => toggleActive.mutate({ id: tpl.id, active: v })} />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(tpl)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => softDelete.mutate(tpl.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function calculateNextRun(pattern: string, dayOfWeek: number | null, dayOfMonth: number | null, timeStr: string, from: Date): Date {
  const next = new Date(from);
  const [h, m] = timeStr.split(':').map(Number);
  next.setUTCHours(h, m, 0, 0);

  switch (pattern) {
    case 'daily': next.setUTCDate(next.getUTCDate() + 1); break;
    case 'weekly': next.setUTCDate(next.getUTCDate() + 7); break;
    case 'biweekly': next.setUTCDate(next.getUTCDate() + 14); break;
    case 'monthly': next.setUTCMonth(next.getUTCMonth() + 1); if (dayOfMonth) next.setUTCDate(Math.min(dayOfMonth, 28)); break;
    case 'quarterly': next.setUTCMonth(next.getUTCMonth() + 3); if (dayOfMonth) next.setUTCDate(Math.min(dayOfMonth, 28)); break;
    default: next.setUTCDate(next.getUTCDate() + 7);
  }
  return next;
}
