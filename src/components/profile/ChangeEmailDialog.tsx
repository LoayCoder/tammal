import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { typography } from "@/theme/tokens";
import { useChangeEmail } from '@/hooks/auth/useAuthMutations';

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: ChangeEmailDialogProps) {
  const { t } = useTranslation();
  const [verificationSent, setVerificationSent] = useState(false);
  const changeEmailMutation = useChangeEmail();
  const isLoading = changeEmailMutation.isPending;

  const emailSchema = z.object({
    newEmail: z
      .string()
      .trim()
      .min(1, t('profile.emailRequired'))
      .email(t('profile.emailInvalid'))
      .max(255, t('profile.emailTooLong'))
      .refine(
        (email) => email.toLowerCase() !== currentEmail?.toLowerCase(),
        t('profile.emailSameAsCurrent')
      ),
  });

  type EmailFormData = z.infer<typeof emailSchema>;

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    try {
      await changeEmailMutation.mutateAsync({ email: data.newEmail });

      setVerificationSent(true);
      toast.success(t('profile.emailVerificationSent'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('already')) {
        form.setError('newEmail', { message: t('profile.emailAlreadyInUse') });
        return;
      }
      logger.error('ChangeEmailDialog', 'Failed to update email', error);
      toast.error(t('profile.emailChangeError'));
    }
  };

  const handleClose = () => {
    form.reset();
    setVerificationSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('profile.changeEmail')}
          </DialogTitle>
          <DialogDescription>{t('profile.changeEmailDescription')}</DialogDescription>
        </DialogHeader>

        {verificationSent ? (
          <div className="space-y-4 py-4">
            <Alert className="border-[hsl(var(--state-completed))]/30 bg-[hsl(var(--state-completed-bg))]">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-completed))]" />
              <AlertDescription className="text-[hsl(var(--state-completed))]">
                {t('profile.emailVerificationSentDescription')}
              </AlertDescription>
            </Alert>
            <p className={typography.subtitle}>
              {t('profile.emailVerificationNote')}
            </p>
            <DialogFooter>
              <Button onClick={handleClose}>{t('common.close')}</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('profile.currentEmail')}: </span>
                  <span className="font-medium">{currentEmail}</span>
                </div>

                <FormField
                  control={form.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.newEmail')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('profile.newEmailPlaceholder')}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('profile.emailChangeWarning')}
                  </AlertDescription>
                </Alert>
              </div>

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
                  {t('profile.sendVerification')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
