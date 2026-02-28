import { Navigate } from 'react-router-dom';
import { useUserPermissions, useHasRole } from '@/hooks/auth/useUserPermissions';
import { useAuth } from '@/hooks/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { loading: authLoading } = useAuth();
  const { isSuperAdmin, isPending: permLoading } = useUserPermissions();
  const { hasRole: isTenantAdmin, isPending: roleLoading } = useHasRole('tenant_admin');

  // CRITICAL: Block ALL routing decisions until auth AND all permission
  // queries are fully resolved. authLoading covers the initial auth state
  // initialization window where queries are idle (not loading) but not yet
  // reflecting the real user state.
  if (authLoading || permLoading || roleLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isSuperAdmin && !isTenantAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
