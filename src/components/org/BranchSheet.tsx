import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch, BranchInput } from '@/hooks/useBranches';

interface BranchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  tenantId: string;
  onSubmit: (data: BranchInput) => void;
}

export function BranchSheet({ open, onOpenChange, branch, tenantId, onSubmit }: BranchSheetProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset } = useForm<BranchInput>();

  useEffect(() => {
    if (open) {
      if (branch) {
        reset({
          tenant_id: branch.tenant_id,
          name: branch.name,
          name_ar: branch.name_ar || '',
          address: branch.address || '',
          address_ar: branch.address_ar || '',
          phone: branch.phone || '',
          email: branch.email || '',
        });
      } else {
        reset({ tenant_id: tenantId, name: '', name_ar: '', address: '', address_ar: '', phone: '', email: '' });
      }
    }
  }, [open, branch, tenantId, reset]);

  const onFormSubmit = (data: BranchInput) => {
    onSubmit({ ...data, tenant_id: tenantId });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{branch ? t('divisions.editDivision') : t('divisions.addDivision')}</SheetTitle>
          <SheetDescription>
            {branch ? t('divisions.editDivisionDesc') : t('divisions.addDivisionDesc')}
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
            <Label>{t('divisions.address')}</Label>
            <Input {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label>{t('divisions.addressAr')}</Label>
            <Input {...register('address_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('divisions.phone')}</Label>
            <Input {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label>{t('divisions.email')}</Label>
            <Input type="email" {...register('email')} />
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
