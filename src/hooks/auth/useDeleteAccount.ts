import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/useAuth';
import { deleteUserData } from '@/services/accountService';

export function useDeleteAccount() {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);

    try {
      await deleteUserData(user.id);
      await signOut();
      toast.success(t('profile.accountDeletionRequested'));
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(t('profile.deleteAccountError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteAccount, isDeleting, user };
}
