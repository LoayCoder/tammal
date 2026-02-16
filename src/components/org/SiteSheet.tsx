import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Site, SiteInput } from '@/hooks/useSites';
import type { Department } from '@/hooks/useDepartments';
import type { Branch } from '@/hooks/useBranches';

interface SiteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: Site | null;
  departments: Department[];
  branches: Branch[];
  tenantId: string;
  onSubmit: (data: SiteInput) => void;
}

export function SiteSheet({ open, onOpenChange, site, departments, branches, tenantId, onSubmit }: SiteSheetProps) {
  const { t, i18n } = useTranslation();
  const { register, handleSubmit, reset, setValue, watch } = useForm<SiteInput>();
  const selectedDepartment = watch('department_id');

  // Auto-derive division from selected department
  const dept = departments.find(d => d.id === selectedDepartment);
  const derivedBranch = dept ? branches.find(b => b.id === dept.branch_id) : null;
  const derivedDivisionName = derivedBranch
    ? (i18n.language === 'ar' && derivedBranch.name_ar ? derivedBranch.name_ar : derivedBranch.name)
    : '—';

  useEffect(() => {
    if (open) {
      if (site) {
        reset({
          tenant_id: site.tenant_id,
          branch_id: site.branch_id,
          department_id: site.department_id,
          name: site.name,
          name_ar: site.name_ar || '',
          address: site.address || '',
          address_ar: site.address_ar || '',
        });
      } else {
        reset({ tenant_id: tenantId, branch_id: '', department_id: null, name: '', name_ar: '', address: '', address_ar: '' });
      }
    }
  }, [open, site, tenantId, reset]);

  const onFormSubmit = (data: SiteInput) => {
    // Auto-set branch_id from department
    const selectedDept = departments.find(d => d.id === data.department_id);
    const branchId = selectedDept?.branch_id || data.branch_id;
    onSubmit({ ...data, tenant_id: tenantId, branch_id: branchId });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{site ? t('sections.editSection') : t('sections.addSection')}</SheetTitle>
          <SheetDescription>
            {site ? t('sections.editSectionDesc') : t('sections.addSectionDesc')}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t('sections.department')}</Label>
            <Select
              value={selectedDepartment || ''}
              onValueChange={(v) => setValue('department_id', v)}
            >
              <SelectTrigger><SelectValue placeholder={t('sections.selectDepartment')} /></SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedDepartment && (
            <div className="space-y-2">
              <Label>{t('sections.division')}</Label>
              <Input value={derivedDivisionName} readOnly className="bg-muted" />
            </div>
          )}
          <div className="space-y-2">
            <Label>{t('sections.name')}</Label>
            <Input {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>{t('sections.nameAr')}</Label>
            <Input {...register('name_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('sections.address')}</Label>
            <Input {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label>{t('sections.addressAr')}</Label>
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
