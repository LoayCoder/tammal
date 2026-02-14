import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Site, SiteInput } from '@/hooks/useSites';
import type { Branch } from '@/hooks/useBranches';

interface SiteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: Site | null;
  branches: Branch[];
  tenantId: string;
  onSubmit: (data: SiteInput) => void;
}

export function SiteSheet({ open, onOpenChange, site, branches, tenantId, onSubmit }: SiteSheetProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, setValue, watch } = useForm<SiteInput>();
  const selectedBranch = watch('branch_id');

  useEffect(() => {
    if (open) {
      if (site) {
        reset({
          tenant_id: site.tenant_id,
          branch_id: site.branch_id,
          name: site.name,
          name_ar: site.name_ar || '',
          address: site.address || '',
          address_ar: site.address_ar || '',
        });
      } else {
        reset({ tenant_id: tenantId, branch_id: '', name: '', name_ar: '', address: '', address_ar: '' });
      }
    }
  }, [open, site, tenantId, reset]);

  const onFormSubmit = (data: SiteInput) => {
    onSubmit({ ...data, tenant_id: tenantId });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{site ? t('sites.editSite') : t('sites.addSite')}</SheetTitle>
          <SheetDescription>
            {site ? t('sites.editSiteDesc') : t('sites.addSiteDesc')}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t('sites.branch')}</Label>
            <Select value={selectedBranch || ''} onValueChange={(v) => setValue('branch_id', v)}>
              <SelectTrigger><SelectValue placeholder={t('sites.selectBranch')} /></SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('sites.name')}</Label>
            <Input {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>{t('sites.nameAr')}</Label>
            <Input {...register('name_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('sites.address')}</Label>
            <Input {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label>{t('sites.addressAr')}</Label>
            <Input {...register('address_ar')} dir="rtl" />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit">{t('common.save')}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
