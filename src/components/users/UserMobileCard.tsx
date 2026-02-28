import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, UserCog, Pencil, UserX, Ban, UserCheck, Trash2 } from 'lucide-react';
import type { UserWithRoles } from '@/hooks/org/useUsers';

interface UserMobileCardProps {
  user: UserWithRoles;
  onEditRoles: (user: UserWithRoles) => void;
  onViewDetails: (user: UserWithRoles) => void;
  onEdit?: (user: UserWithRoles) => void;
  onDeactivate?: (user: UserWithRoles) => void;
  onSuspend?: (user: UserWithRoles) => void;
  onReactivate?: (user: UserWithRoles) => void;
  onDelete?: (user: UserWithRoles) => void;
}

export function UserMobileCard({
  user,
  onEditRoles,
  onViewDetails,
  onEdit,
  onDeactivate,
  onSuspend,
  onReactivate,
  onDelete,
}: UserMobileCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t('users.statusActive'),
      inactive: t('users.statusInactive'),
      suspended: t('users.statusSuspended'),
    };
    return labels[status] || status;
  };

  const roles = user.user_roles?.filter(ur => ur.roles).map(ur => ur.roles!) ?? [];

  return (
    <div
      className="glass-card p-4 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => onViewDetails(user)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{user.full_name || t('users.unnamed')}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email || user.user_id}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(user); }}>
              <UserCog className="me-2 h-4 w-4" />{t('users.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditRoles(user); }}>
              <Shield className="me-2 h-4 w-4" />{t('users.manageRoles')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(user); }}>
                <Pencil className="me-2 h-4 w-4" />{t('users.editUser')}
              </DropdownMenuItem>
            )}
            {user.status === 'active' ? (
              <>
                {onDeactivate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeactivate(user); }}>
                    <UserX className="me-2 h-4 w-4" />{t('users.deactivateUser')}
                  </DropdownMenuItem>
                )}
                {onSuspend && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSuspend(user); }}>
                    <Ban className="me-2 h-4 w-4" />{t('users.suspendUser')}
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              onReactivate && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReactivate(user); }}>
                  <UserCheck className="me-2 h-4 w-4" />{t('users.reactivateUser')}
                </DropdownMenuItem>
              )
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(user); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="me-2 h-4 w-4" />{t('users.deleteUser')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <Badge variant={getStatusVariant(user.status || 'active')} className="text-xs">
          {getStatusLabel(user.status || 'active')}
        </Badge>
        {roles.length > 0 ? roles.map(role => (
          <Badge
            key={role.id}
            style={{ backgroundColor: role.color + '20', color: role.color, borderColor: role.color }}
            variant="outline"
            className="text-xs"
          >
            {isRTL && role.name_ar ? role.name_ar : role.name}
          </Badge>
        )) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">{t('users.noRoles')}</Badge>
        )}
      </div>
    </div>
  );
}
