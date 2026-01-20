import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<'confirm' | 'verify'>('confirm');

  const confirmText = 'DELETE';

  const deleteSchema = z.object({
    confirmation: z.string().refine((val) => val === confirmText, {
      message: t('profile.deleteConfirmMismatch', { text: confirmText }),
    }),
  });

  const form = useForm<{ confirmation: string }>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const handleClose = () => {
    setStep('confirm');
    form.reset();
    onOpenChange(false);
  };

  const handleProceed = () => {
    setStep('verify');
  };

  const handleDelete = async (data: { confirmation: string }) => {
    if (data.confirmation !== confirmText) return;

    setIsDeleting(true);
    try {
      // Delete user data first (profile, etc.)
      if (user?.id) {
        // Remove from profiles table
        await supabase.from('profiles').delete().eq('user_id', user.id);
        
        // Remove from user_roles table
        await supabase.from('user_roles').delete().eq('user_id', user.id);
      }

      // Note: Full account deletion requires admin API or edge function
      // For now, we'll sign out and inform the user
      await signOut();
      
      toast.success(t('profile.accountDeletionRequested'));
      handleClose();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(t('profile.deleteAccountError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t('profile.deleteAccount')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {step === 'confirm' ? (
                <>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {t('profile.deleteAccountWarning')}
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">
                    {t('profile.deleteAccountDescription')}
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc ps-5 space-y-1">
                    <li>{t('profile.deleteConsequence1')}</li>
                    <li>{t('profile.deleteConsequence2')}</li>
                    <li>{t('profile.deleteConsequence3')}</li>
                  </ul>
                </>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleDelete)} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t('profile.deleteConfirmInstruction', { text: confirmText })}
                    </p>
                    <FormField
                      control={form.control}
                      name="confirmation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profile.confirmDeletion')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={confirmText}
                              className="font-mono"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={isDeleting}
                      >
                        {isDeleting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                        {t('profile.deleteAccountPermanently')}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {step === 'confirm' && (
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <Button variant="destructive" onClick={handleProceed}>
              {t('profile.proceedToDelete')}
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
