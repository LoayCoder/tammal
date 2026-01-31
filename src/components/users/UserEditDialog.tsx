import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Camera, Trash2, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserWithRoles } from '@/hooks/useUsers';

const formSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
});

type FormValues = z.infer<typeof formSchema>;

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRoles | null;
  onSave: (userId: string, data: FormValues & { avatar_url?: string | null }) => Promise<void>;
  onPasswordReset?: (userId: string, email: string) => Promise<void>;
  isSaving: boolean;
  isResettingPassword?: boolean;
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  onSave,
  onPasswordReset,
  isSaving,
  isResettingPassword,
}: UserEditDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showPasswordResetConfirm, setShowPasswordResetConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      job_title: '',
      department: '',
      location: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        phone: (user as any).phone || '',
        job_title: (user as any).job_title || '',
        department: (user as any).department || '',
        location: (user as any).location || '',
        status: (user as any).status || 'active',
      });
      setAvatarUrl(user.avatar_url);
    }
  }, [user, form]);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      active: t('users.statusActive'),
      inactive: t('users.statusInactive'),
      suspended: t('users.statusSuspended'),
    };
    return statusLabels[status] || status;
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.invalidFileType'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.fileTooLarge'));
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success(t('profile.avatarUpdated'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.avatarUpdateError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!user) return;
    await onSave(user.id, { ...values, avatar_url: avatarUrl });
    onOpenChange(false);
  };

  const handlePasswordReset = async () => {
    if (!user || !onPasswordReset) return;
    const email = (user as any).email || '';
    if (!email) {
      toast.error(t('users.noEmailForReset'));
      return;
    }
    await onPasswordReset(user.user_id, email);
    setShowPasswordResetConfirm(false);
  };

  if (!user) return null;

  const userEmail = (user as any).email || user.user_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('users.editUser')}</DialogTitle>
            <DialogDescription>{t('users.editUserDescription')}</DialogDescription>
          </DialogHeader>

          {/* Profile Header Section */}
          <div className="flex items-start gap-4 py-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xl">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg truncate">{user.full_name || t('users.unnamed')}</div>
              <div className="text-sm text-muted-foreground truncate">{userEmail}</div>
              <Badge variant={getStatusVariant((user as any).status || 'active')} className="mt-2">
                {getStatusLabel((user as any).status || 'active')}
              </Badge>
            </div>
          </div>

          {/* Avatar Actions */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="me-2 h-4 w-4" />
              {t('users.uploadPhoto')}
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('users.removePhoto')}
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('users.basicInfo')}</Label>
                
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.name')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.phone')} {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Organizational Info Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('users.organizationalInfo')}</Label>
                
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.jobTitle')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.jobTitle')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.department')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.department')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users.location')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.location')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Status Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('users.userStatus')}</Label>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('users.userStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t('users.statusActive')}</SelectItem>
                          <SelectItem value="inactive">{t('users.statusInactive')}</SelectItem>
                          <SelectItem value="suspended">{t('users.statusSuspended')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Security Section */}
              {onPasswordReset && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">{t('users.securityActions')}</Label>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t('users.sendPasswordReset')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('users.sendPasswordResetDescription')}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordResetConfirm(true)}
                          disabled={isResettingPassword}
                        >
                          {isResettingPassword ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="me-2 h-4 w-4" />
                          )}
                          {t('users.sendPasswordReset')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSaving || isUploading}>
                  {isSaving ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={showPasswordResetConfirm} onOpenChange={setShowPasswordResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.sendPasswordReset')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.confirmPasswordReset', { email: userEmail })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset} disabled={isResettingPassword}>
              {isResettingPassword ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
