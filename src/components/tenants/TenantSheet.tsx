import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantBrandingTab } from './TenantBrandingTab';
import { TenantModuleControl, DEFAULT_SETTINGS, type TenantSettings } from './TenantModuleControl';
import { TenantContactTab } from './TenantContactTab';
import { TenantSecurityControl, DEFAULT_SECURITY_SETTINGS, type SecuritySettings } from './TenantSecurityControl';
import { usePlansManagement } from '@/hooks/usePlans';
import type { Tenant } from '@/hooks/useTenants';

const TENANT_STATUSES = ['active', 'trial', 'suspended', 'inactive'] as const;

const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().max(100).optional().or(z.literal('')),
  domain: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(TENANT_STATUSES),
  plan_id: z.string().optional().or(z.literal('')),
  // Contact fields
  industry: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  contact_person: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  cr_number: z.string().optional().or(z.literal('')),
  vat_number: z.string().optional().or(z.literal('')),
  employee_count: z.number().nullable().optional(),
  preferred_currency: z.string().optional(),
  billing_email: z.string().email().optional().or(z.literal('')),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

interface BrandingConfig {
  primary_hsl?: string;
  secondary_hsl?: string;
  accent_hsl?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
}

interface TenantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function TenantSheet({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isSubmitting,
}: TenantSheetProps) {
  const { t } = useTranslation();
  const { plans } = usePlansManagement();
  const isEditing = !!tenant;
  const [branding, setBranding] = useState<BrandingConfig>({});
  const [settings, setSettings] = useState<TenantSettings>(DEFAULT_SETTINGS);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      status: 'trial',
      plan_id: '',
      industry: '',
      country: '',
      city: '',
      contact_email: '',
      contact_phone: '',
      contact_person: '',
      notes: '',
      cr_number: '',
      vat_number: '',
      employee_count: null,
      preferred_currency: 'SAR',
      billing_email: '',
    },
  });

  useEffect(() => {
    if (tenant) {
      const t = tenant as any;
      form.reset({
        name: tenant.name,
        slug: t.slug || '',
        domain: tenant.domain || '',
        status: tenant.status,
        plan_id: t.plan_id || '',
        industry: t.industry || '',
        country: t.country || '',
        city: t.city || '',
        contact_email: t.contact_email || '',
        contact_phone: t.contact_phone || '',
        contact_person: t.contact_person || '',
        notes: t.notes || '',
        cr_number: t.cr_number || '',
        vat_number: t.vat_number || '',
        employee_count: t.employee_count || null,
        preferred_currency: t.preferred_currency || 'SAR',
        billing_email: t.billing_email || '',
      });
      setBranding((tenant.branding_config as BrandingConfig) || {});
      setSettings(t.settings || DEFAULT_SETTINGS);
      setSecurity({
        mfa_trust_duration_days: t.mfa_trust_duration_days ?? DEFAULT_SECURITY_SETTINGS.mfa_trust_duration_days,
        session_timeout_minutes: t.session_timeout_minutes ?? DEFAULT_SECURITY_SETTINGS.session_timeout_minutes,
        max_concurrent_sessions: t.max_concurrent_sessions ?? DEFAULT_SECURITY_SETTINGS.max_concurrent_sessions,
        glass_break_active: t.glass_break_active ?? DEFAULT_SECURITY_SETTINGS.glass_break_active,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        domain: '',
        status: 'trial',
        plan_id: '',
        industry: '',
        country: '',
        city: '',
        contact_email: '',
        contact_phone: '',
        contact_person: '',
        notes: '',
        cr_number: '',
        vat_number: '',
        employee_count: null,
        preferred_currency: 'SAR',
        billing_email: '',
      });
      setBranding({});
      setSettings(DEFAULT_SETTINGS);
      setSecurity(DEFAULT_SECURITY_SETTINGS);
    }
  }, [tenant, form]);

  const handleSubmit = (data: TenantFormValues) => {
    onSubmit({
      ...data,
      slug: data.slug || null,
      domain: data.domain || null,
      plan_id: data.plan_id || null,
      branding_config: branding,
      settings,
      ...security,
    });
  };

  const activePlans = plans.filter(p => p.is_active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? t('tenants.editTenant') : t('tenants.addTenant')}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? t('tenants.editTenantDescription')
              : t('tenants.addTenantDescription')}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">{t('tenants.generalTab')}</TabsTrigger>
            <TabsTrigger value="contact">{t('tenants.contactTab')}</TabsTrigger>
            <TabsTrigger value="security">{t('tenants.securityTab')}</TabsTrigger>
            <TabsTrigger value="modules">{t('tenants.modulesTab')}</TabsTrigger>
            <TabsTrigger value="branding">{t('branding.title')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Form {...form}>
              <form id="tenant-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tenants.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tenants.slug')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="company-name" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{t('tenants.slugDescription')}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tenants.domain')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tenants.plan')}</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === '_none' ? '' : val)} 
                        value={field.value || '_none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tenants.selectPlan')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">{t('tenants.noPlan')}</SelectItem>
                          {activePlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TENANT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(`common.${status}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="contact" className="mt-4">
            <TenantContactTab form={form} />
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <TenantSecurityControl settings={security} onChange={setSecurity} />
          </TabsContent>

          <TabsContent value="modules" className="mt-4">
            <TenantModuleControl settings={settings} onChange={setSettings} />
          </TabsContent>

          <TabsContent value="branding" className="mt-4">
            <TenantBrandingTab branding={branding} onChange={setBranding} />
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="tenant-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.loading') : t('common.save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
