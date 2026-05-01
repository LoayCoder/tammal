import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardView, type DashboardView } from '@/hooks/analytics/useDashboardView';
import { useUserPermissions } from '@/hooks/auth/useUserPermissions';
import { DashboardOverviewTab } from '@/components/dashboard/DashboardOverviewTab';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';

import EmployeeHome from './EmployeeHome';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';

export default function Dashboard() {
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();
  const { view, setView, canSwitch, isAdmin, isPending: viewLoading } = useDashboardView();
  const { isSuperAdmin } = useUserPermissions();

  if (authLoading || viewLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <EmployeeHome />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-4 sm:p-6">
      <Tabs value={view} onValueChange={(v) => setView(v as DashboardView)} className="mx-auto max-w-7xl space-y-6">
      <TabsList className="h-auto w-full gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
        <TabsTrigger value="overview" className="flex-1 px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
          {t('dashboard.overviewTab')}
        </TabsTrigger>
        <TabsTrigger value="wellness" className="flex-1 px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
          {t('dashboard.wellnessTab')}
        </TabsTrigger>
        {canSwitch && (
          <TabsTrigger value="personal" className="flex-1 px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
            {t('dashboard.personalTab')}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview">
        <ErrorBoundary title={t('common.sectionError', 'Section error')} description={t('common.sectionErrorDescription', 'This section encountered an error. Other tabs still work.')}>
          <DashboardOverviewTab isSuperAdmin={isSuperAdmin} />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="wellness">
        <ErrorBoundary title={t('common.sectionError', 'Section error')}>
          <OrgDashboard />
        </ErrorBoundary>
      </TabsContent>

      {canSwitch && (
        <TabsContent value="personal">
          <ErrorBoundary title={t('common.sectionError', 'Section error')}>
            <EmployeeHome />
          </ErrorBoundary>
        </TabsContent>
      )}
      </Tabs>
    </div>
  );
}