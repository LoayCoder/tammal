import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmergencyContacts, type EmergencyContact } from '@/hooks/crisis/useCrisisSupport';
import { useProfile } from '@/hooks/auth/useProfile';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function EmergencyContactsTab() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;
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
    if (!form.title.trim()) {
      toast.error(t('crisisSupport.admin.nameRequired'));
      return;
    }

    try {
      if (editing) {
        await updateContact.mutateAsync({ id: editing.id, ...form });
      } else {
        if (!tenantId) {
          toast.error(t('crisisSupport.admin.tenantRequired'));
          return;
        }
        await createContact.mutateAsync({ tenant_id: tenantId, ...form } as any);
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
