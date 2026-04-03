import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const passwordSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, t('profile.passwordMinLength'))
        .max(72, t('profile.passwordTooLong'))
        .regex(/[a-z]/, t('profile.passwordNeedsLowercase'))
        .regex(/[A-Z]/, t('profile.passwordNeedsUppercase'))
        .regex(/[0-9]/, t('profile.passwordNeedsNumber')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.passwordMismatch'),
      path: ['confirmPassword'],
    });

  type PasswordFormData = z.infer<typeof passwordSchema>;

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      setPasswordChanged(true);
      toast.success(t('profile.passwordChangeSuccess'));
    } catch (error) {
      logger.error('ChangePassword', 'Failed to update password', error);
      toast.error(t('profile.passwordChangeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setPasswordChanged(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onOpenChange(false);
  };

  const newPassword = form.watch('newPassword');
  const passwordRequirements = [
    { met: newPassword.length >= 8, label: t('profile.req8Chars') },
    { met: /[a-z]/.test(newPassword), label: t('profile.reqLowercase') },
    { met: /[A-Z]/.test(newPassword), label: t('profile.reqUppercase') },
    { met: /[0-9]/.test(newPassword), label: t('profile.reqNumber') },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('profile.changePassword')}
          </DialogTitle>
          <DialogDescription>{t('profile.changePasswordDescription')}</DialogDescription>
        </DialogHeader>

        {passwordChanged ? (
          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {t('profile.passwordChangedSuccessfully')}
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button onClick={handleClose}>{t('common.close')}</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profile.newPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder={t('profile.newPasswordPlaceholder')}
                          {...field}
                          disabled={isLoading}
                          className="pe-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={isLoading}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password requirements */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('profile.passwordRequirements')}:</p>
                <div className="grid grid-cols-2 gap-1">
                  {passwordRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 text-xs ${
                        req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      }`}
                    >
                      <CheckCircle2 className={`h-3 w-3 ${req.met ? 'opacity-100' : 'opacity-40'}`} />
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profile.confirmNewPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={t('profile.confirmPasswordPlaceholder')}
                          {...field}
                          disabled={isLoading}
                          className="pe-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('profile.updatePassword')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
