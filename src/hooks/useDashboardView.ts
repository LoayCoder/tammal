import { useState, useCallback } from 'react';
import { useUserPermissions, useHasRole } from './useUserPermissions';
import { useCurrentEmployee } from './useCurrentEmployee';

export type DashboardView = 'overview' | 'wellness' | 'personal';

export function useDashboardView() {
  const { isSuperAdmin, isLoading: permLoading } = useUserPermissions();
  const { hasRole: isTenantAdmin, isLoading: roleLoading } = useHasRole('tenant_admin');
  const { hasEmployeeProfile, isLoading: empLoading } = useCurrentEmployee();

  const isAdmin = isSuperAdmin || isTenantAdmin;

  const [view, setViewState] = useState<DashboardView>(() => {
    if (typeof window === 'undefined') return 'overview';
    const stored = localStorage.getItem('dashboard-view') as DashboardView;
    if (stored === 'overview' || stored === 'wellness' || stored === 'personal') return stored;
    return 'overview';
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
    isLoading: permLoading || roleLoading || empLoading,
  };
}
