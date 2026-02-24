import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WorkSite, WorkSiteInput } from '@/hooks/org/useWorkSites';
import type { Department } from '@/hooks/org/useDepartments';
import type { Site } from '@/hooks/org/useSites';

interface WorkSiteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workSite?: WorkSite | null;
  departments: Department[];
  sections: Site[];
  tenantId: string;
  onSubmit: (data: WorkSiteInput) => void;
}

export function WorkSiteSheet({ open, onOpenChange, workSite, departments, sections, tenantId, onSubmit }: WorkSiteSheetProps) {
  const { t, i18n } = useTranslation();
  const { register, handleSubmit, reset, setValue, watch } = useForm<WorkSiteInput>();
  const selectedDept = watch('department_id');
  const selectedSection = watch('section_id');

  // Filter sections by selected department
  const filteredSections = selectedDept
    ? sections.filter(s => s.department_id === selectedDept)
    : sections;

  useEffect(() => {
    if (open) {
      if (workSite) {
        reset({
          tenant_id: workSite.tenant_id,
          name: workSite.name,
          name_ar: workSite.name_ar || '',
          address: workSite.address || '',
          address_ar: workSite.address_ar || '',
          department_id: workSite.department_id,
          section_id: workSite.section_id,
        });
      } else {
        reset({ tenant_id: tenantId, name: '', name_ar: '', address: '', address_ar: '', department_id: null, section_id: null });
      }
    }
  }, [open, workSite, tenantId, reset]);

  const onFormSubmit = (data: WorkSiteInput) => {
    onSubmit({ ...data, tenant_id: tenantId });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{workSite ? t('workSites.editSite') : t('workSites.addSite')}</SheetTitle>
          <SheetDescription>
            {workSite ? t('workSites.editSiteDesc') : t('workSites.addSiteDesc')}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t('workSites.name')}</Label>
            <Input {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>{t('workSites.nameAr')}</Label>
            <Input {...register('name_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('organization.departments')}</Label>
            <Select
              value={selectedDept || '_none'}
              onValueChange={(v) => {
                setValue('department_id', v === '_none' ? null : v);
                setValue('section_id', null);
              }}
            >
              <SelectTrigger><SelectValue placeholder={t('organization.selectDepartment')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('common.none')}</SelectItem>
                {departments.filter(d => d.is_active !== false).map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {i18n.language === 'ar' && d.name_ar ? d.name_ar : d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('sections.title')}</Label>
            <Select
              value={selectedSection || '_none'}
              onValueChange={(v) => setValue('section_id', v === '_none' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder={t('sections.selectSection')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('common.none')}</SelectItem>
                {filteredSections.filter(s => s.is_active !== false).map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {i18n.language === 'ar' && s.name_ar ? s.name_ar : s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('workSites.address')}</Label>
            <Input {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label>{t('workSites.addressAr')}</Label>
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
