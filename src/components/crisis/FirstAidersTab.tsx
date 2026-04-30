import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirstAiders, type FirstAider } from '@/hooks/crisis';
import { useProfile } from '@/hooks/auth/useProfile';
import { useEmployees } from '@/hooks/org/useEmployees';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function FirstAidersTab() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;
  const { firstAiders, isPending, createFirstAider, updateFirstAider, deleteFirstAider } = useFirstAiders();
  const { employees } = useEmployees({ status: 'active' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFA, setEditingFA] = useState<FirstAider | null>(null);
  const [form, setForm] = useState({
    user_id: '',
    display_name: '',
    department: '',
    role_title: '',
    bio: '',
    max_active_cases: 3,
    allow_anonymous_requests: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const firstAiderSchema = z.object({
    user_id: z.string().optional(),
    display_name: z.string().trim().min(2, 'Display name is required'),
    department: z.string().optional(),
    role_title: z.string().optional(),
    bio: z.string().optional(),
    max_active_cases: z.coerce.number().int().min(1, 'Must allow at least 1 case').max(20, 'Cannot exceed 20 active cases'),
    allow_anonymous_requests: z.boolean(),
  });

  // Filter out employees who are already first aiders
  const availableEmployees = useMemo(() => {
    const existingUserIds = new Set(firstAiders.map(fa => fa.user_id));
    return employees.filter(emp => emp.user_id && !existingUserIds.has(emp.user_id));
  }, [employees, firstAiders]);

  const openCreate = () => {
    setEditingFA(null);
    setForm({ user_id: '', display_name: '', department: '', role_title: '', bio: '', max_active_cases: 3, allow_anonymous_requests: true });
    setDialogOpen(true);
  };

  const openEdit = (fa: FirstAider) => {
    setEditingFA(fa);
    setForm({
      user_id: fa.user_id,
      display_name: fa.display_name,
      department: fa.department || '',
      role_title: fa.role_title || '',
      bio: fa.bio || '',
      max_active_cases: fa.max_active_cases,
      allow_anonymous_requests: fa.allow_anonymous_requests,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setForm(f => ({
        ...f,
        user_id: emp.user_id || '',
        display_name: emp.full_name,
        department: emp.department || '',
        role_title: emp.role_title || '',
      }));
    }
  };

  const handleSave = async () => {
    const parsed = firstAiderSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        display_name: fieldErrors.display_name?.[0] || '',
        max_active_cases: fieldErrors.max_active_cases?.[0] || '',
      });
      return;
    }
    if (!editingFA && !form.user_id) {
      setErrors({ user_id: 'Please select an employee' });
      return;
    }
    setErrors({});
    try {
      if (editingFA) {
        await updateFirstAider.mutateAsync({
          id: editingFA.id,
          display_name: form.display_name,
          department: form.department || null,
          role_title: form.role_title || null,
          bio: form.bio || null,
          max_active_cases: form.max_active_cases,
          allow_anonymous_requests: form.allow_anonymous_requests,
        } as any);
      } else {
        if (!tenantId) {
          toast.error(t('crisisSupport.admin.tenantRequired'));
          return;
        }
        await createFirstAider.mutateAsync({
          tenant_id: tenantId,
          user_id: form.user_id,
          display_name: form.display_name,
          department: form.department || null,
          role_title: form.role_title || null,
          bio: form.bio || null,
          max_active_cases: form.max_active_cases,
          allow_anonymous_requests: form.allow_anonymous_requests,
        } as any);
      }
      toast.success(t('common.success'));
      setDialogOpen(false);
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('crisisSupport.admin.firstAiders')}</CardTitle>
          <CardDescription>{t('crisisSupport.admin.firstAidersDesc')}</CardDescription>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 me-1" />
          {t('crisisSupport.admin.addFirstAider')}
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-muted-foreground">{t('common.loading')}</p>
        ) : firstAiders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t('crisisSupport.admin.noFirstAiders')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('crisisSupport.admin.name')}</TableHead>
                <TableHead>{t('crisisSupport.admin.department')}</TableHead>
                <TableHead>{t('crisisSupport.admin.statusLabel')}</TableHead>
                <TableHead>{t('crisisSupport.admin.activeCases')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {firstAiders.map(fa => (
                <TableRow key={fa.id}>
                  <TableCell className="font-medium">{fa.display_name}</TableCell>
                  <TableCell>{fa.department || '—'}</TableCell>
                  <TableCell>
                    {(() => {
                      const statusMap: Record<string, { emoji: string; key: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
                        available: { emoji: '🟢', key: 'crisisSupport.status.available', variant: 'default' },
                        busy: { emoji: '🟡', key: 'crisisSupport.status.busy', variant: 'secondary' },
                        outside_hours: { emoji: '🔵', key: 'crisisSupport.status.outside_hours', variant: 'outline' },
                        temporarily_unavailable: { emoji: '🟠', key: 'crisisSupport.status.temporarily_unavailable', variant: 'destructive' },
                        offline: { emoji: '⚫', key: 'crisisSupport.status.offline', variant: 'secondary' },
                      };
                      const info = statusMap[fa.statusLabel] || statusMap.offline;
                      return (
                        <Badge variant={info.variant} className="text-xs">
                          {info.emoji} {t(info.key)}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{fa.max_active_cases}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(fa)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteFirstAider.mutate(fa.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFA ? t('crisisSupport.admin.editFirstAider') : t('crisisSupport.admin.addFirstAider')}</DialogTitle>
            <DialogDescription>{t('crisisSupport.admin.firstAiderFormDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Employee picker — only for create */}
            {!editingFA && (
              <div>
                <Label>{t('crisisSupport.admin.selectEmployee')}</Label>
                <Select onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crisisSupport.admin.selectEmployee')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEmployees.length === 0 ? (
                      <SelectItem value="__none" disabled>{t('crisisSupport.admin.noAvailableEmployees')}</SelectItem>
                    ) : (
                      availableEmployees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} {emp.department ? `(${emp.department})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.user_id && <p className="text-sm text-destructive mt-1">{errors.user_id}</p>}
              </div>
            )}
            <div>
              <Label>{t('crisisSupport.admin.name')}</Label>
              <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
              {errors.display_name && <p className="text-sm text-destructive mt-1">{errors.display_name}</p>}
            </div>
            <div>
              <Label>{t('crisisSupport.admin.department')}</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <Label>{t('crisisSupport.admin.roleTitle')}</Label>
              <Input value={form.role_title} onChange={e => setForm(f => ({ ...f, role_title: e.target.value }))} />
            </div>
            <div>
              <Label>{t('crisisSupport.admin.bio')}</Label>
              <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <Label>{t('crisisSupport.admin.maxCases')}</Label>
              <Input type="number" min={1} max={10} value={form.max_active_cases} onChange={e => setForm(f => ({ ...f, max_active_cases: parseInt(e.target.value) || 3 }))} />
              {errors.max_active_cases && <p className="text-sm text-destructive mt-1">{errors.max_active_cases}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('crisisSupport.admin.allowAnonymous')}</Label>
              <Switch checked={form.allow_anonymous_requests} onCheckedChange={v => setForm(f => ({ ...f, allow_anonymous_requests: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
