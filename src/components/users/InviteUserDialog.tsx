import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTenantInvitations } from '@/hooks/org/useTenantInvitations';
import { useRoles } from '@/hooks/auth/useRoles';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export function InviteUserDialog({ open, onOpenChange, tenantId }: InviteUserDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { createInvitation, isCreating } = useTenantInvitations(tenantId);
  const { roles, isPending: rolesLoading } = useRoles(tenantId);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    setSelectedRoles(prev =>
      checked ? [...prev, roleId] : prev.filter(id => id !== roleId)
    );
  };

  const handleSubmit = () => {
    if (!email.trim()) return;

    createInvitation({
      email: email.trim(),
      full_name: fullName.trim() || undefined,
      phone_number: phoneNumber.trim() || undefined,
      tenant_id: tenantId,
      expiry_days: parseInt(expiryDays),
    });
    
    // Reset form
    setEmail('');
    setFullName('');
    setPhoneNumber('');
    setSelectedRoles([]);
    setExpiryDays('7');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('users.inviteUser')}</DialogTitle>
          <DialogDescription>
            {t('users.inviteUserDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('users.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">{t('users.name')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('users.name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('tenants.contactPhone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+966 5XX XXX XXXX"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">{t('invitations.expiresIn')}</Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 {t('common.day')}</SelectItem>
                <SelectItem value="3">3 {t('common.days')}</SelectItem>
                <SelectItem value="7">7 {t('common.days')}</SelectItem>
                <SelectItem value="14">14 {t('common.days')}</SelectItem>
                <SelectItem value="30">30 {t('common.days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('users.preAssignRoles')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('users.preAssignRolesHint')}
            </p>
            {rolesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : roles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t('roles.noRoles')}
              </p>
            ) : (
              <ScrollArea className="h-32 rounded-md border p-2">
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) =>
                          handleRoleToggle(role.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {isRTL && role.name_ar ? role.name_ar : role.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!email.trim() || isCreating}>
            {isCreating && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('invitations.sendInvitation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}