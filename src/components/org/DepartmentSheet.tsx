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
import type { Branch } from '@/hooks/useBranches';
import type { Employee } from '@/hooks/useEmployees';

interface DepartmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  departments: Department[];
  branches: Branch[];
  employees: Employee[];
  tenantId: string;
  onSubmit: (data: DepartmentInput) => void;
  parentId?: string | null;
}

export function DepartmentSheet({
  open, onOpenChange, department, departments, branches, employees, tenantId, onSubmit, parentId,
}: DepartmentSheetProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, setValue, watch } = useForm<DepartmentInput>();

  const selectedParent = watch('parent_id');
  const selectedHead = watch('head_employee_id');
  const selectedBranch = watch('branch_id');

  useEffect(() => {
    if (open) {
      if (department) {
        reset({
          tenant_id: department.tenant_id,
          name: department.name,
          name_ar: department.name_ar,
          description: department.description,
          description_ar: department.description_ar,
          parent_id: department.parent_id,
          branch_id: department.branch_id,
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
          parent_id: parentId || null,
          branch_id: null,
          head_employee_id: null,
          color: '#3B82F6',
          sort_order: 0,
        });
      }
    }
  }, [open, department, tenantId, parentId, reset]);

  const onFormSubmit = (data: DepartmentInput) => {
    onSubmit({ ...data, tenant_id: tenantId });
    onOpenChange(false);
  };

  const availableParents = departments.filter(d => d.id !== department?.id);

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
            <Label>{t('organization.branch')}</Label>
            <Select
              value={selectedBranch || '_none'}
              onValueChange={(v) => setValue('branch_id', v === '_none' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder={t('organization.selectBranch')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('common.noData')}</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
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
            <Label>{t('organization.parent')}</Label>
            <Select
              value={selectedParent || '_none'}
              onValueChange={(v) => setValue('parent_id', v === '_none' ? null : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('common.noData')}</SelectItem>
                {availableParents.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('organization.head')}</Label>
            <Select
              value={selectedHead || '_none'}
              onValueChange={(v) => setValue('head_employee_id', v === '_none' ? null : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('common.noData')}</SelectItem>
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
