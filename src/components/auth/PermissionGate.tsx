import { ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2 } from 'lucide-react';

interface PermissionGateProps {
  /** Single permission code to check */
  permission?: string;
  /** Multiple permission codes (uses OR logic by default) */
  permissions?: string[];
  /** If true, requires ALL permissions instead of ANY */
  requireAll?: boolean;
  /** Content to show if permission denied */
  fallback?: ReactNode;
  /** Show loading state while checking permissions */
  showLoading?: boolean;
  /** Content to show when user has permission */
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showLoading = false,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useUserPermissions();

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Utility component for showing "No Permission" message
export function NoPermission({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <p>{message || "You don't have permission to access this feature"}</p>
    </div>
  );
}
