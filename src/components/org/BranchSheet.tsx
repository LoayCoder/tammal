import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch, BranchInput } from '@/hooks/org/useBranches';

const branchSchema = z.object({
  tenant_id: z.string(),
  name: z.string().min(1, 'Name is required').max(100),
  name_ar: z.string().max(100).optional().default(''),
  address: z.string().max(255).optional().default(''),
  address_ar: z.string().max(255).optional().default(''),
  phone: z.string().max(30).optional().default(''),
  email: z.string().email('Invalid email').or(z.literal('')).optional().default(''),
});

interface BranchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  tenantId: string;
  onSubmit: (data: BranchInput) => void;
}

export function BranchSheet({ open, onOpenChange, branch, tenantId, onSubmit }: BranchSheetProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BranchInput>({
    resolver: zodResolver(branchSchema),
  });

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
          <SheetTitle>{branch ? t('branches.editBranch') : t('branches.addBranch')}</SheetTitle>
          <SheetDescription>
            {branch ? t('branches.editBranchDesc') : t('branches.addBranchDesc')}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t('branches.name')}</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('branches.nameAr')}</Label>
            <Input {...register('name_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('branches.address')}</Label>
            <Input {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label>{t('branches.addressAr')}</Label>
            <Input {...register('address_ar')} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{t('branches.phone')}</Label>
            <Input {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label>{t('branches.email')}</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
