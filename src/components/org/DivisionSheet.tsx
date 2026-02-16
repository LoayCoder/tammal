import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Division, DivisionInput } from '@/hooks/useDivisions';
import type { Employee } from '@/hooks/useEmployees';

interface DivisionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: Division | null;
  employees: Employee[];
  tenantId: string;
  onSubmit: (data: DivisionInput) => void;
}

export function DivisionSheet({ open, onOpenChange, division, employees, tenantId, onSubmit }: DivisionSheetProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, setValue, watch } = useForm<DivisionInput>();
  const selectedHead = watch('head_employee_id');

  useEffect(() => {
    if (open) {
      if (division) {
        reset({
          tenant_id: division.tenant_id,
          name: division.name,
          name_ar: division.name_ar || '',
          description: division.description || '',
          description_ar: division.description_ar || '',
          head_employee_id: division.head_employee_id,
        });
      } else {
        reset({ tenant_id: tenantId, name: '', name_ar: '', description: '', description_ar: '', head_employee_id: null });
      }
    }
  }, [open, division, tenantId, reset]);

  const onFormSubmit = (data: DivisionInput) => {
    onSubmit({ ...data, tenant_id: tenantId });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{division ? t('divisions.editDivision') : t('divisions.addDivision')}</SheetTitle>
          <SheetDescription>
            {division ? t('divisions.editDivisionDesc') : t('divisions.addDivisionDesc')}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t('divisions.name')}</Label>
            <Input {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>{t('divisions.nameAr')}</Label>
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
          <div className="flex gap-2 pt-4">
            <Button type="submit">{t('common.save')}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
