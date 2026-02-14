import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, UserX, Ban } from 'lucide-react';

export type AccountStatus = 'not_invited' | 'invited' | 'active' | 'suspended' | 'inactive';

interface AccountStatusBadgeProps {
  status: AccountStatus;
}

const iconMap = {
  not_invited: UserX,
  invited: Clock,
  active: CheckCircle,
  suspended: Ban,
  inactive: UserX,
};

const variantMap: Record<AccountStatus, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  not_invited: 'outline',
  invited: 'secondary',
  active: 'default',
  suspended: 'destructive',
  inactive: 'secondary',
};

const i18nKeyMap: Record<AccountStatus, string> = {
  not_invited: 'userManagement.notInvited',
  invited: 'userManagement.invitationSent',
  active: 'userManagement.activeUser',
  suspended: 'userManagement.suspendedUser',
  inactive: 'userManagement.inactiveUser',
};

export function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
  const { t } = useTranslation();
  const Icon = iconMap[status];

  return (
    <Badge variant={variantMap[status]} className="gap-1">
      <Icon className="h-3 w-3" />
      {t(i18nKeyMap[status])}
    </Badge>
  );
}
