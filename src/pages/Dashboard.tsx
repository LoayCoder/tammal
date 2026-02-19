import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardView } from '@/hooks/useDashboardView';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuditLog } from '@/hooks/useAuditLog';
import { DashboardViewSwitcher } from '@/components/dashboard/DashboardViewSwitcher';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';
import { SaasStatsSection } from '@/components/dashboard/SaasStatsSection';
import EmployeeHome from './EmployeeHome';

export default function Dashboard() {
  const { loading: authLoading } = useAuth();
  const { view, setView, canSwitch, isAdmin, isLoading: viewLoading } = useDashboardView();
  const { isSuperAdmin } = useUserPermissions();

  if (authLoading || viewLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  // Non-admin users always see employee home
  if (!isAdmin) {
    return <EmployeeHome />;
  }

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      {canSwitch && (
        <div className="flex items-center justify-between">
          <div />
          <DashboardViewSwitcher view={view} onViewChange={setView} />
        </div>
      )}

      {/* Render based on view */}
      {view === 'personal' ? (
        <EmployeeHome />
      ) : (
        <>
          {isSuperAdmin && <SaasStatsSection />}
          <OrgDashboard />
        </>
      )}
    </div>
  );
}
