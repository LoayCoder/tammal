import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, Mail, RefreshCw, Trash2, Copy, Check, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantInvitations, type Invitation, type CreateInvitationInput } from '@/hooks/useTenantInvitations';
import { toast } from 'sonner';

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

interface InvitationManagementProps {
  tenantId: string;
}

export function InvitationManagement({ tenantId }: InvitationManagementProps) {
  const { t } = useTranslation();
  const {
    invitations,
    isLoading,
    createInvitation,
    resendInvitation,
    revokeInvitation,
    isCreating,
    isResending,
    getStatus,
    getDaysRemaining,
  } = useTenantInvitations(tenantId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    expiry_days: '7',
    delivery_channel: 'email',
  });

  const handleCreate = () => {
    createInvitation({
      tenant_id: tenantId,
      email: formData.email,
      full_name: formData.full_name || undefined,
      phone_number: formData.phone_number || undefined,
      expiry_days: parseInt(formData.expiry_days),
      delivery_channel: formData.delivery_channel as 'email' | 'whatsapp',
    });
    setShowCreateDialog(false);
    setFormData({ email: '', full_name: '', phone_number: '', expiry_days: '7', delivery_channel: 'email' });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t('invitations.codeCopied'));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (invitation: Invitation) => {
    const status = getStatus(invitation);
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'default',
      used: 'secondary',
      expired: 'destructive',
      revoked: 'outline',
    };
    return (
      <Badge variant={variants[status]}>
        {t(`invitations.status.${status}`)}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('invitations.title')}</CardTitle>
              <CardDescription>{t('invitations.description')}</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="me-2 h-4 w-4" />
              {t('invitations.create')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('invitations.noInvitations')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invitations.code')}</TableHead>
                  <TableHead>{t('invitations.recipient')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('invitations.expires')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const status = getStatus(invitation);
                  const isPending = status === 'pending';
                  
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {invitation.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCode(invitation.code)}
                          >
                            {copiedCode === invitation.code ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invitation.full_name || invitation.email}</p>
                          {invitation.full_name && (
                            <p className="text-xs text-muted-foreground">{invitation.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation)}</TableCell>
                      <TableCell>
                        {isPending ? (
                          <span className="text-sm">
                            {t('invitations.daysRemaining', { count: getDaysRemaining(invitation) })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(invitation.expires_at), 'PP')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          {isPending && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => resendInvitation(invitation.id)}
                                disabled={isResending}
                                title={t('invitations.resend')}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => revokeInvitation(invitation.id)}
                                title={t('invitations.revoke')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invitation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('invitations.create')}</DialogTitle>
            <DialogDescription>{t('invitations.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('invitations.email')} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('invitations.fullName')}</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('invitations.phoneNumber')}</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                dir="ltr"
                placeholder="+966XXXXXXXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('invitations.expiresIn')}</Label>
                <Select
                  value={formData.expiry_days}
                  onValueChange={(value) => setFormData({ ...formData, expiry_days: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('invitations.deliveryChannel')}</Label>
                <Select
                  value={formData.delivery_channel}
                  onValueChange={(value) => setFormData({ ...formData, delivery_channel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {t('invitations.email')}
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        WhatsApp
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!formData.email || isCreating}>
              {isCreating ? t('common.loading') : t('invitations.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
