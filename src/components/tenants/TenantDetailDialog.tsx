import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TenantStatusBadge } from './TenantStatusBadge';
import { TenantTrialControl } from './TenantTrialControl';
import { TenantSecurityControl, type SecuritySettings, DEFAULT_SECURITY_SETTINGS } from './TenantSecurityControl';
import { InvitationManagement } from './InvitationManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, Users, Globe, Mail, Phone, FileText } from 'lucide-react';
import type { Tenant } from '@/hooks/useTenants';

interface TenantDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  onUpdateTrial: (tenantId: string, action: 'start' | 'extend' | 'end', params?: any) => void;
  onUpdateSecurity: (tenantId: string, settings: SecuritySettings) => void;
  isUpdating: boolean;
}

export function TenantDetailDialog({
  open,
  onOpenChange,
  tenant,
  onUpdateTrial,
  onUpdateSecurity,
  isUpdating,
}: TenantDetailDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  if (!tenant) return null;

  const tenantData = tenant as any;

  const trialData = {
    subscription_status: tenantData.subscription_status || 'inactive',
    trial_start_date: tenantData.trial_start_date || null,
    trial_end_date: tenantData.trial_end_date || null,
  };

  const securitySettings: SecuritySettings = {
    mfa_trust_duration_days: tenantData.mfa_trust_duration_days ?? DEFAULT_SECURITY_SETTINGS.mfa_trust_duration_days,
    session_timeout_minutes: tenantData.session_timeout_minutes ?? DEFAULT_SECURITY_SETTINGS.session_timeout_minutes,
    max_concurrent_sessions: tenantData.max_concurrent_sessions ?? DEFAULT_SECURITY_SETTINGS.max_concurrent_sessions,
    glass_break_active: tenantData.glass_break_active ?? DEFAULT_SECURITY_SETTINGS.glass_break_active,
  };

  const handleStartTrial = (days: number) => {
    onUpdateTrial(tenant.id, 'start', { days });
  };

  const handleExtendTrial = (params: { days?: number; endDate?: string }) => {
    onUpdateTrial(tenant.id, 'extend', params);
  };

  const handleEndTrial = () => {
    onUpdateTrial(tenant.id, 'end');
  };

  const handleSecurityChange = (settings: SecuritySettings) => {
    onUpdateSecurity(tenant.id, settings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{tenant.name}</DialogTitle>
            <TenantStatusBadge status={tenant.status} />
          </div>
          <DialogDescription>
            {tenantData.slug && <span className="font-mono">{tenantData.slug}</span>}
            {tenant.domain && (
              <>
                <span className="mx-2">•</span>
                <span>{tenant.domain}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('tenants.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="subscription">{t('tenants.tabs.subscription')}</TabsTrigger>
            <TabsTrigger value="security">{t('tenants.tabs.security')}</TabsTrigger>
            <TabsTrigger value="invitations">{t('tenants.tabs.invitations')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">{t('tenants.createdAt')}</span>
                  </div>
                  <p className="mt-1 font-medium">{format(new Date(tenant.created_at), 'PP')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">{t('tenants.plan')}</span>
                  </div>
                  <p className="mt-1 font-medium">
                    {tenant.plan?.name || t('tenants.noPlan')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs">{t('tenants.industry')}</span>
                  </div>
                  <p className="mt-1 font-medium">
                    {tenantData.industry ? t(`tenants.industries.${tenantData.industry}`) : '-'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">{t('tenants.employeeCount')}</span>
                  </div>
                  <p className="mt-1 font-medium">{tenantData.employee_count || '-'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact & Business Info */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('tenants.contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">{t('tenants.contactPerson')}:</span>
                    <span>{tenantData.contact_person || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{tenantData.contact_email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span dir="ltr">{tenantData.contact_phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span>{tenantData.country ? `${tenantData.city || ''}, ${tenantData.country}` : '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('tenants.businessInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">{t('tenants.crNumber')}:</span>
                    <span dir="ltr">{tenantData.cr_number || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">{t('tenants.vatNumber')}:</span>
                    <span dir="ltr">{tenantData.vat_number || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">{t('tenants.currency')}:</span>
                    <span>{tenantData.preferred_currency || 'SAR'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">{t('tenants.billingEmail')}:</span>
                    <span>{tenantData.billing_email || '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {tenantData.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('tenants.notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tenantData.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscription" className="mt-4">
            <TenantTrialControl
              tenantId={tenant.id}
              trialData={trialData}
              onStartTrial={handleStartTrial}
              onExtendTrial={handleExtendTrial}
              onEndTrial={handleEndTrial}
              isUpdating={isUpdating}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <TenantSecurityControl
              settings={securitySettings}
              onChange={handleSecurityChange}
            />
          </TabsContent>

          <TabsContent value="invitations" className="mt-4">
            <InvitationManagement tenantId={tenant.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
