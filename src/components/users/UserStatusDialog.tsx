import { useTranslation } from 'react-i18next';
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
import { UserX, Ban, Trash2, UserCheck } from 'lucide-react';
import type { UserWithRoles } from '@/hooks/org/useUsers';

export type StatusAction = 'deactivate' | 'suspend' | 'reactivate' | 'delete';

interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRoles | null;
  action: StatusAction;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function UserStatusDialog({
  open,
  onOpenChange,
  user,
  action,
  onConfirm,
  isLoading,
}: UserStatusDialogProps) {
  const { t } = useTranslation();

  const getActionConfig = () => {
    switch (action) {
      case 'deactivate':
        return {
          title: t('users.deactivateUser'),
          description: t('users.confirmDeactivate'),
          icon: UserX,
          variant: 'default' as const,
          buttonText: t('users.deactivateUser'),
        };
      case 'suspend':
        return {
          title: t('users.suspendUser'),
          description: t('users.confirmSuspend'),
          icon: Ban,
          variant: 'destructive' as const,
          buttonText: t('users.suspendUser'),
        };
      case 'reactivate':
        return {
          title: t('users.reactivateUser'),
          description: t('users.confirmReactivate'),
          icon: UserCheck,
          variant: 'default' as const,
          buttonText: t('users.reactivateUser'),
        };
      case 'delete':
        return {
          title: t('users.deleteUser'),
          description: t('users.confirmDelete'),
          icon: Trash2,
          variant: 'destructive' as const,
          buttonText: t('users.deleteUser'),
        };
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <Icon className={`h-5 w-5 ${config.variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {config.description}
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="font-medium">{user.full_name || t('users.unnamed')}</div>
              <div className="text-sm text-muted-foreground">{(user as any).email || user.user_id}</div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={config.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading ? t('common.loading') : config.buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
