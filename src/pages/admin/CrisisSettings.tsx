import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useFirstAiders, useEmergencyContacts, useFirstAiderSchedule, type FirstAider, type EmergencyContact, type FirstAiderSchedule } from '@/hooks/useCrisisSupport';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Users, Clock, Phone, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

// Default weekly rules
const DEFAULT_WEEKLY_RULES: Record<string, { from: string; to: string }[]> = {
  sun: [{ from: '09:00', to: '17:00' }],
  mon: [{ from: '09:00', to: '17:00' }],
  tue: [{ from: '09:00', to: '17:00' }],
  wed: [{ from: '09:00', to: '17:00' }],
  thu: [{ from: '09:00', to: '17:00' }],
  fri: [],
  sat: [],
};

export default function CrisisSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // We need tenant_id — derive from profile context
  const [activeTab, setActiveTab] = useState('first-aiders');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('crisisSupport.admin.title')}</h1>
        <p className="text-muted-foreground">{t('crisisSupport.admin.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="first-aiders" className="gap-1.5">
            <Users className="h-4 w-4" />
            {t('crisisSupport.admin.firstAidersTab')}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5">
            <Clock className="h-4 w-4" />
            {t('crisisSupport.admin.schedulesTab')}
          </TabsTrigger>
          <TabsTrigger value="emergency" className="gap-1.5">
            <Phone className="h-4 w-4" />
            {t('crisisSupport.admin.emergencyTab')}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <Shield className="h-4 w-4" />
            {t('crisisSupport.admin.rulesTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="first-aiders">
          <FirstAidersTab />
        </TabsContent>
        <TabsContent value="schedules">
          <SchedulesTab />
        </TabsContent>
        <TabsContent value="emergency">
          <EmergencyContactsTab />
        </TabsContent>
        <TabsContent value="rules">
          <RulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── First Aiders Tab ────────────────────────────────────────────────
function FirstAidersTab() {
  const { t } = useTranslation();
  const { firstAiders, isLoading, createFirstAider, updateFirstAider, deleteFirstAider } = useFirstAiders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFA, setEditingFA] = useState<FirstAider | null>(null);
  const [form, setForm] = useState({ display_name: '', department: '', role_title: '', bio: '', max_active_cases: 3, allow_anonymous_requests: true });

  const openCreate = () => {
    setEditingFA(null);
    setForm({ display_name: '', department: '', role_title: '', bio: '', max_active_cases: 3, allow_anonymous_requests: true });
    setDialogOpen(true);
  };

  const openEdit = (fa: FirstAider) => {
    setEditingFA(fa);
    setForm({
      display_name: fa.display_name,
      department: fa.department || '',
      role_title: fa.role_title || '',
      bio: fa.bio || '',
      max_active_cases: fa.max_active_cases,
      allow_anonymous_requests: fa.allow_anonymous_requests,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingFA) {
        await updateFirstAider.mutateAsync({ id: editingFA.id, ...form } as any);
        toast.success(t('common.success'));
      } else {
        // For create, we need tenant_id and user_id — placeholder, admin will pick a user
        // For now, we'll use user_id from a separate input
        toast.error('Please assign a user first');
        return;
      }
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
        {isLoading ? (
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
                    <Badge variant={fa.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                      {fa.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                    </Badge>
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
            <div>
              <Label>{t('crisisSupport.admin.name')}</Label>
              <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
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

// ─── Schedules Tab ───────────────────────────────────────────────────
function SchedulesTab() {
  const { t } = useTranslation();
  const { firstAiders } = useFirstAiders();
  const [selectedFA, setSelectedFA] = useState<string>('');
  const { schedule, upsertSchedule } = useFirstAiderSchedule(selectedFA || undefined);
  const [rules, setRules] = useState<Record<string, { from: string; to: string }[]>>(DEFAULT_WEEKLY_RULES);
  const [sla, setSla] = useState(60);

  const handleLoadSchedule = () => {
    if (schedule) {
      setRules(schedule.weekly_rules || DEFAULT_WEEKLY_RULES);
      setSla(schedule.response_sla_minutes);
    } else {
      setRules(DEFAULT_WEEKLY_RULES);
      setSla(60);
    }
  };

  const handleSave = async () => {
    if (!selectedFA) return;
    const fa = firstAiders.find(f => f.id === selectedFA);
    if (!fa) return;
    try {
      await upsertSchedule.mutateAsync({
        first_aider_id: selectedFA,
        tenant_id: fa.tenant_id,
        weekly_rules: rules as any,
        response_sla_minutes: sla,
      });
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('crisisSupport.admin.schedules')}</CardTitle>
        <CardDescription>{t('crisisSupport.admin.schedulesDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{t('crisisSupport.admin.selectFirstAider')}</Label>
          <Select value={selectedFA} onValueChange={v => { setSelectedFA(v); }}>
            <SelectTrigger><SelectValue placeholder={t('crisisSupport.admin.selectFirstAider')} /></SelectTrigger>
            <SelectContent>
              {firstAiders.map(fa => (
                <SelectItem key={fa.id} value={fa.id}>{fa.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFA && (
          <>
            <div className="space-y-3">
              {DAY_KEYS.map(day => {
                const slots = rules[day] || [];
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-10 text-sm font-medium capitalize">{t(`orgDashboard.days.${day}`)}</span>
                    {slots.length === 0 ? (
                      <span className="text-sm text-muted-foreground">{t('crisisSupport.admin.dayOff')}</span>
                    ) : (
                      slots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <Input type="time" value={slot.from} className="w-28" onChange={e => {
                            const newRules = { ...rules };
                            newRules[day] = [...slots];
                            newRules[day][i] = { ...slot, from: e.target.value };
                            setRules(newRules);
                          }} />
                          <span>–</span>
                          <Input type="time" value={slot.to} className="w-28" onChange={e => {
                            const newRules = { ...rules };
                            newRules[day] = [...slots];
                            newRules[day][i] = { ...slot, to: e.target.value };
                            setRules(newRules);
                          }} />
                        </div>
                      ))
                    )}
                    <Button variant="ghost" size="sm" onClick={() => {
                      const newRules = { ...rules };
                      if (slots.length > 0) {
                        newRules[day] = [];
                      } else {
                        newRules[day] = [{ from: '09:00', to: '17:00' }];
                      }
                      setRules(newRules);
                    }}>
                      {slots.length > 0 ? t('crisisSupport.admin.markOff') : t('crisisSupport.admin.addSlot')}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div>
              <Label>{t('crisisSupport.admin.slaMinutes')}</Label>
              <Input type="number" min={5} max={480} value={sla} onChange={e => setSla(parseInt(e.target.value) || 60)} className="w-32" />
            </div>

            <Button onClick={handleSave}>{t('common.save')}</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Emergency Contacts Tab ──────────────────────────────────────────
function EmergencyContactsTab() {
  const { t } = useTranslation();
  const { contacts, isLoading, createContact, updateContact, deleteContact } = useEmergencyContacts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [form, setForm] = useState({ title: '', phone: '', description: '', available_24_7: false, country: 'SA' });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', phone: '', description: '', available_24_7: false, country: 'SA' });
    setDialogOpen(true);
  };

  const openEdit = (c: EmergencyContact) => {
    setEditing(c);
    setForm({ title: c.title, phone: c.phone || '', description: c.description || '', available_24_7: c.available_24_7, country: c.country });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateContact.mutateAsync({ id: editing.id, ...form });
        toast.success(t('common.success'));
      } else {
        // Need tenant_id — this will come from the user's profile context
        // For now, the RLS policy + backend will handle tenant_id injection
        toast.error('Tenant context required');
        return;
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('crisisSupport.admin.emergencyContacts')}</CardTitle>
          <CardDescription>{t('crisisSupport.admin.emergencyContactsDesc')}</CardDescription>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 me-1" />
          {t('crisisSupport.admin.addContact')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">{t('common.loading')}</p>
        ) : contacts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t('crisisSupport.admin.noContacts')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('crisisSupport.admin.contactTitle')}</TableHead>
                <TableHead>{t('crisisSupport.admin.contactPhone')}</TableHead>
                <TableHead>{t('crisisSupport.admin.availability')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.phone || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={c.available_24_7 ? 'default' : 'secondary'}>{c.available_24_7 ? '24/7' : t('crisisSupport.admin.limited')}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteContact.mutate(c.id)}>
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
            <DialogTitle>{editing ? t('crisisSupport.admin.editContact') : t('crisisSupport.admin.addContact')}</DialogTitle>
            <DialogDescription>{t('crisisSupport.admin.contactFormDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('crisisSupport.admin.contactTitle')}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>{t('crisisSupport.admin.contactPhone')}</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>{t('crisisSupport.admin.contactDescription')}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('crisisSupport.admin.available247')}</Label>
              <Switch checked={form.available_24_7} onCheckedChange={v => setForm(f => ({ ...f, available_24_7: v }))} />
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

// ─── Rules Tab ───────────────────────────────────────────────────────
function RulesTab() {
  const { t } = useTranslation();

  const riskMapping = [
    { intent: 'self_harm', risk: 'high', color: 'destructive' as const },
    { intent: 'unsafe', risk: 'high', color: 'destructive' as const },
    { intent: 'overwhelmed', risk: 'moderate', color: 'secondary' as const },
    { intent: 'anxiety', risk: 'moderate', color: 'secondary' as const },
    { intent: 'work_stress', risk: 'moderate', color: 'secondary' as const },
    { intent: 'other', risk: 'moderate', color: 'secondary' as const },
    { intent: 'talk', risk: 'low', color: 'default' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('crisisSupport.admin.riskMapping')}</CardTitle>
        <CardDescription>{t('crisisSupport.admin.riskMappingDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('crisisSupport.admin.intent')}</TableHead>
              <TableHead>{t('crisisSupport.admin.riskLevel')}</TableHead>
              <TableHead>{t('crisisSupport.admin.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riskMapping.map(r => (
              <TableRow key={r.intent}>
                <TableCell className="font-medium capitalize">{t(`crisisSupport.intents.${r.intent}`)}</TableCell>
                <TableCell>
                  <Badge variant={r.color}>{r.risk.toUpperCase()}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.risk === 'high'
                    ? t('crisisSupport.admin.highRiskAction')
                    : t('crisisSupport.admin.normalAction')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">{t('crisisSupport.admin.highRiskNote')}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('crisisSupport.admin.highRiskNoteDesc')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
