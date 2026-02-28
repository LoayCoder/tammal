import { Navigate } from 'react-router-dom';
import { useUserPermissions, useHasRole } from '@/hooks/auth/useUserPermissions';
import { useAuth } from '@/hooks/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ManagerOrAdminRouteProps {
  children: React.ReactNode;
}

export function ManagerOrAdminRoute({ children }: ManagerOrAdminRouteProps) {
  const { loading: authLoading } = useAuth();
  const { isSuperAdmin, isPending: permLoading } = useUserPermissions();
  const { hasRole: isTenantAdmin, isPending: taLoading } = useHasRole('tenant_admin');
  const { hasRole: isManager, isPending: mgrLoading } = useHasRole('manager');

  if (authLoading || permLoading || taLoading || mgrLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isSuperAdmin && !isTenantAdmin && !isManager) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
