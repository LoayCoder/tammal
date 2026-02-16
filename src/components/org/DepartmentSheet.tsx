import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Department, DepartmentInput } from '@/hooks/useDepartments';
import type { Division } from '@/hooks/useDivisions';
import type { Employee } from '@/hooks/useEmployees';

interface DepartmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  divisions: Division[];
  employees: Employee[];
  tenantId: string;
  onSubmit: (data: DepartmentInput) => void;
}

export function DepartmentSheet({
  open, onOpenChange, department, divisions, employees, tenantId, onSubmit,
}: DepartmentSheetProps) {
  const { t, i18n } = useTranslation();
  const { register, handleSubmit, reset, setValue, watch } = useForm<DepartmentInput>();

  const selectedHead = watch('head_employee_id');
  const selectedDivision = watch('division_id');

  useEffect(() => {
    if (open) {
      if (department) {
        reset({
          tenant_id: department.tenant_id,
          name: department.name,
          name_ar: department.name_ar,
          description: department.description,
          description_ar: department.description_ar,
          parent_id: null,
          branch_id: department.branch_id,
          division_id: department.division_id,
          head_employee_id: department.head_employee_id,
          color: department.color,
          sort_order: department.sort_order,
        });
      } else {
        reset({
          tenant_id: tenantId,
          name: '',
          name_ar: '',
          description: '',
          description_ar: '',
          parent_id: null,
          branch_id: null,
          division_id: null,
          head_employee_id: null,
          color: '#3B82F6',
          sort_order: 0,
        });
      }
    }
  }, [open, department, tenantId, reset]);

  const onFormSubmit = (data: DepartmentInput) => {
    onSubmit({ ...data, tenant_id: tenantId, parent_id: null });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{department ? t('organization.editDepartment') : t('organization.addDepartment')}</SheetTitle>
          <SheetDescription>
            {department ? t('organization.editDepartmentDesc') : t('organization.addDepartmentDesc')}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t('divisions.title')}</Label>
            <Select
              value={selectedDivision || '_none'}
              onValueChange={(v) => setValue('division_id', v === '_none' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder={t('organization.selectDivision')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('common.none')}</SelectItem>
                {divisions.filter(d => d.is_active !== false).map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {i18n.language === 'ar' && d.name_ar ? d.name_ar : d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('organization.name')}</Label>
            <Input {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>{t('organization.nameAr')}</Label>
            <Input {...register('name_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('organization.description')}</Label>
            <Textarea {...register('description')} />
          </div>
          <div className="space-y-2">
            <Label>{t('organization.descriptionAr')}</Label>
            <Textarea {...register('description_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('organization.head')}</Label>
            <Select
              value={selectedHead || '_none'}
              onValueChange={(v) => setValue('head_employee_id', v === '_none' ? null : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('common.none')}</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('organization.color')}</Label>
            <Input type="color" {...register('color')} className="h-10 w-20 p-1" />
          </div>
          <div className="space-y-2">
            <Label>{t('organization.sortOrder')}</Label>
            <Input type="number" {...register('sort_order', { valueAsNumber: true })} />
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
