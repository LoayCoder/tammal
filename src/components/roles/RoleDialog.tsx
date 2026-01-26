import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Role, CreateRoleInput, UpdateRoleInput } from '@/hooks/useRoles';

const createRoleSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('validation.roleNameRequired')),
  name_ar: z.string().optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  base_role: z.enum(['super_admin', 'tenant_admin', 'manager', 'user']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('validation.invalidColorFormat')),
});

type RoleFormValues = z.infer<ReturnType<typeof createRoleSchema>>;

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  tenantId: string;
  onSave: (data: CreateRoleInput | UpdateRoleInput) => void;
  isSaving: boolean;
}

const ROLE_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#6b7280', // Gray
];

export function RoleDialog({ open, onOpenChange, role, tenantId, onSave, isSaving }: RoleDialogProps) {
  const { t } = useTranslation();
  const roleSchema = createRoleSchema(t);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      base_role: 'user',
      color: '#6366f1',
    },
  });

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        name_ar: role.name_ar || '',
        description: role.description || '',
        description_ar: role.description_ar || '',
        base_role: role.base_role,
        color: role.color,
      });
    } else {
      form.reset({
        name: '',
        name_ar: '',
        description: '',
        description_ar: '',
        base_role: 'user',
        color: '#6366f1',
      });
    }
  }, [role, form]);

  const handleSubmit = (values: RoleFormValues) => {
    if (role) {
      onSave({ id: role.id, ...values } as UpdateRoleInput);
    } else {
      onSave({ tenant_id: tenantId, name: values.name, ...values } as CreateRoleInput);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {role ? t('roles.editRole') : t('roles.createRole')}
          </DialogTitle>
          <DialogDescription>
            {role ? t('roles.editRoleDescription') : t('roles.createRoleDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('roles.nameEn')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('placeholders.roleNameEn')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('roles.nameAr')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('placeholders.roleNameAr')} dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('roles.descriptionEn')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder={t('placeholders.roleDescription')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('roles.descriptionAr')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder={t('placeholders.roleDescriptionAr')} dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="base_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('roles.baseRole')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('roles.selectBaseRole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">{t('roles.baseRoles.user')}</SelectItem>
                      <SelectItem value="manager">{t('roles.baseRoles.manager')}</SelectItem>
                      <SelectItem value="tenant_admin">{t('roles.baseRoles.tenantAdmin')}</SelectItem>
                      <SelectItem value="super_admin">{t('roles.baseRoles.superAdmin')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('roles.color')}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {ROLE_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              field.value === color
                                ? 'border-foreground scale-110'
                                : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-10 h-8 p-0 border-0 cursor-pointer"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {role ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
