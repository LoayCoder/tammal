import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/auth/useProfile';
import { useAuth } from '@/hooks/auth/useAuth';
import { NavLink } from '@/components/NavLink';

interface UserProfileSectionProps {
  isCollapsed: boolean;
}

export const UserProfileSection = React.memo(function UserProfileSection({ isCollapsed }: UserProfileSectionProps) {
  const { profile } = useProfile();
  const { user } = useAuth();

  const name = profile?.full_name || user?.email?.split('@')[0] || '';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <NavLink
      to="/settings/profile"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))]"
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={profile?.avatar_url || undefined} alt={name} />
        <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-sm font-medium text-sidebar-foreground">{name}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground rtl:-scale-x-100" />
        </>
      )}
    </NavLink>
  );
});
