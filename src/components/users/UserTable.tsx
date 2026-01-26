import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, UserCog, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { UserWithRoles } from '@/hooks/useUsers';

interface UserTableProps {
  users: UserWithRoles[];
  isLoading: boolean;
  onEditRoles: (user: UserWithRoles) => void;
  onViewDetails: (user: UserWithRoles) => void;
}

export function UserTable({ users, isLoading, onEditRoles, onViewDetails }: UserTableProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadges = (user: UserWithRoles) => {
    const roles = user.user_roles
      ?.filter(ur => ur.roles)
      .map(ur => ur.roles!);

    if (!roles || roles.length === 0) {
      return <Badge variant="outline" className="text-muted-foreground">{t('users.noRoles')}</Badge>;
    }

    return roles.map(role => (
      <Badge
        key={role.id}
        style={{ backgroundColor: role.color + '20', color: role.color, borderColor: role.color }}
        variant="outline"
        className="me-1"
      >
        {isRTL && role.name_ar ? role.name_ar : role.name}
      </Badge>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{t('users.noUsers')}</h3>
        <p className="text-muted-foreground">{t('users.noUsersDescription')}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('users.user')}</TableHead>
          <TableHead>{t('users.roles')}</TableHead>
          <TableHead>{t('users.systemRole')}</TableHead>
          <TableHead>{t('users.createdAt')}</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="cursor-pointer" onClick={() => onViewDetails(user)}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.full_name || t('users.unnamed')}</div>
                  <div className="text-sm text-muted-foreground">{user.user_id}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {getRoleBadges(user)}
              </div>
            </TableCell>
            <TableCell>
              {user.user_roles?.map(ur => (
                <Badge key={ur.id} variant="secondary" className="me-1">
                  {ur.role}
                </Badge>
              ))}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(user.created_at, i18n.language)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(user); }}>
                    <UserCog className="me-2 h-4 w-4" />
                    {t('users.viewDetails')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditRoles(user); }}>
                    <Shield className="me-2 h-4 w-4" />
                    {t('users.manageRoles')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
