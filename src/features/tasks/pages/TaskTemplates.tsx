import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, FileText, Search, CheckSquare } from 'lucide-react';
import { useTaskTemplates, type CreateTemplateInput } from '@/features/tasks/hooks/useTaskTemplates';

const PRIORITIES = [
  { value: 'low', label: 'tasks.priority.low' },
  { value: 'medium', label: 'tasks.priority.medium' },
  { value: 'high', label: 'tasks.priority.high' },
  { value: 'critical', label: 'tasks.priority.critical' },
];

const VISIBILITIES = [
  { value: 'private', label: 'tasks.visibility.private' },
  { value: 'department', label: 'tasks.visibility.department' },
  { value: 'cross_department', label: 'tasks.visibility.cross_department' },
  { value: 'organization', label: 'tasks.visibility.organization' },
];

const defaultForm: CreateTemplateInput & { checklist_text: string } = {
  name: '',
  name_ar: '',
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  priority: 'medium',
  visibility: 'department',
  estimated_minutes: null,
  checklist_items: [],
  checklist_text: '',
};

export default function TaskTemplates() {
  const { t } = useTranslation();
  const { templates, isPending, createTemplate, updateTemplate, deleteTemplate, toggleActive } = useTaskTemplates();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered = templates.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.title?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (tpl: any) => {
    setEditId(tpl.id);
    const items = Array.isArray(tpl.checklist_items) ? tpl.checklist_items : [];
    setForm({
      name: tpl.name || '',
      name_ar: tpl.name_ar || '',
      title: tpl.title || '',
      title_ar: tpl.title_ar || '',
      description: tpl.description || '',
      description_ar: tpl.description_ar || '',
      priority: tpl.priority || 'medium',
      visibility: tpl.visibility || 'department',
      estimated_minutes: tpl.estimated_minutes,
      checklist_items: items,
      checklist_text: items.map((i: any) => i.title || i).join('\n'),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const checklistItems = form.checklist_text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(title => ({ title, status: 'pending' }));

    const payload: CreateTemplateInput = {
      name: form.name,
      name_ar: form.name_ar,
      title: form.title,
      title_ar: form.title_ar,
      description: form.description,
      description_ar: form.description_ar,
      priority: form.priority,
      visibility: form.visibility,
      estimated_minutes: form.estimated_minutes,
      checklist_items: checklistItems,
    };

    if (editId) {
      await updateTemplate.mutateAsync({ id: editId, ...payload });
    } else {
      await createTemplate.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('taskTemplates.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('taskTemplates.subtitle')}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('taskTemplates.create')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="ps-9"
        />
      </div>

      {isPending ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t('taskTemplates.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <Card key={tpl.id} className={!tpl.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{tpl.name || tpl.title}</CardTitle>
                    {tpl.name && tpl.title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{tpl.title}</p>
                    )}
                  </div>
                  <Switch
                    checked={tpl.is_active}
                    onCheckedChange={active => toggleActive.mutate({ id: tpl.id, active })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tpl.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{tpl.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={priorityColor(tpl.priority)}>{t(`tasks.priority.${tpl.priority}`)}</Badge>
                  <Badge variant="outline">{t(`tasks.visibility.${tpl.visibility}`)}</Badge>
                  {tpl.estimated_minutes && (
                    <Badge variant="outline">{tpl.estimated_minutes}m</Badge>
                  )}
                  {Array.isArray(tpl.checklist_items) && tpl.checklist_items.length > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <CheckSquare className="h-3 w-3" />
                      {tpl.checklist_items.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(tpl)}>
                    <Pencil className="h-3.5 w-3.5 me-1" />{t('common.edit')}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(tpl.id)}>
                    <Trash2 className="h-3.5 w-3.5 me-1" />{t('common.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditId(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t('taskTemplates.edit') : t('taskTemplates.create')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('taskTemplates.templateName')} *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>{t('taskTemplates.templateNameAr')}</Label>
              <Input dir="rtl" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} /></div>
            <div><Label>{t('tasks.fields.title')} *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>{t('tasks.fields.titleAr')}</Label>
              <Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
            <div><Label>{t('tasks.fields.description')}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('tasks.fields.priority')}</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{t(p.label)}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label>{t('tasks.fields.visibility')}</Label>
                <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBILITIES.map(v => <SelectItem key={v.value} value={v.value}>{t(v.label)}</SelectItem>)}
                  </SelectContent>
                </Select></div>
            </div>
            <div><Label>{t('tasks.fields.estimatedMinutes')}</Label>
              <Input type="number" value={form.estimated_minutes ?? ''} onChange={e => setForm(f => ({ ...f, estimated_minutes: e.target.value ? Number(e.target.value) : null }))} placeholder="60" /></div>
            <div><Label>{t('taskTemplates.checklistHint')}</Label>
              <Textarea value={form.checklist_text} onChange={e => setForm(f => ({ ...f, checklist_text: e.target.value }))} rows={4} placeholder={t('taskTemplates.checklistPlaceholder')} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.title.trim() || createTemplate.isPending || updateTemplate.isPending}>
              {editId ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('taskTemplates.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('taskTemplates.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteTemplate.mutate(deleteId); setDeleteId(null); }}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
