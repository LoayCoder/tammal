import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/useAuth';
import { logger } from '@/lib/logger';
import { deleteUserData } from '@/services/accountService';

const TAG = 'useDeleteAccount';

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
      // NOTE: deleteUserData removes profile/roles data and signs the user out.
      // The underlying auth account is scheduled for deletion by the backend.
      toast.success(t('profile.accountDeletionRequested'));
    } catch (error) {
      logger.error(TAG, 'Failed to delete account', error);
      toast.error(t('profile.deleteAccountError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteAccount, isDeleting, user };
}
