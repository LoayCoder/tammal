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
import { usePlansManagement } from '@/hooks/usePlans';
import type { Tenant } from '@/hooks/useTenants';

const TENANT_STATUSES = ['active', 'trial', 'suspended', 'inactive'] as const;

const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().max(100).optional().or(z.literal('')),
  domain: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(TENANT_STATUSES),
  plan_id: z.string().optional().or(z.literal('')),
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

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      status: 'trial',
      plan_id: '',
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name,
        slug: (tenant as any).slug || '',
        domain: tenant.domain || '',
        status: tenant.status,
        plan_id: (tenant as any).plan_id || '',
      });
      setBranding((tenant.branding_config as BrandingConfig) || {});
      setSettings((tenant as any).settings || DEFAULT_SETTINGS);
    } else {
      form.reset({
        name: '',
        slug: '',
        domain: '',
        status: 'trial',
        plan_id: '',
      });
      setBranding({});
      setSettings(DEFAULT_SETTINGS);
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
    });
  };

  const activePlans = plans.filter(p => p.is_active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t('tenants.generalTab')}</TabsTrigger>
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tenants.selectPlan')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">{t('tenants.noPlan')}</SelectItem>
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
