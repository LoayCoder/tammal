import { Navigate } from 'react-router-dom';
import { useUserPermissions, useHasRole } from '@/hooks/useUserPermissions';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isSuperAdmin, isLoading: permLoading } = useUserPermissions();
  const isTenantAdmin = useHasRole('tenant_admin');

  if (permLoading) {
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
