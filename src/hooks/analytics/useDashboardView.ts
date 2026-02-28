import { useState, useCallback } from 'react';
import { useUserPermissions, useHasRole } from '@/hooks/auth/useUserPermissions';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';

export type DashboardView = 'overview' | 'wellness' | 'personal';

export function useDashboardView() {
  const { isSuperAdmin, isPending: permLoading } = useUserPermissions();
  const { hasRole: isTenantAdmin, isPending: roleLoading } = useHasRole('tenant_admin');
  const { hasEmployeeProfile, isPending: empLoading } = useCurrentEmployee();

  const isAdmin = isSuperAdmin || isTenantAdmin;

  const [view, setViewState] = useState<DashboardView>(() => {
    if (typeof window === 'undefined') return 'personal';
    const stored = localStorage.getItem('dashboard-view') as DashboardView;
    if (stored === 'overview' || stored === 'wellness' || stored === 'personal') return stored;
    return 'personal';
  });

  const setView = useCallback((v: DashboardView) => {
    setViewState(v);
    localStorage.setItem('dashboard-view', v);
  }, []);

  const canSwitch = isAdmin && hasEmployeeProfile;
  const effectiveView: DashboardView = !isAdmin ? 'personal' : view;

  return {
    view: effectiveView,
    setView,
    canSwitch,
    isAdmin,
    isPending: permLoading || roleLoading || empLoading,
  };
}
