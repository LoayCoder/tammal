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
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <EmployeeHome />;
  }

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as DashboardView)} className="space-y-6">
      <TabsList className="w-full h-auto bg-muted/6 rounded-lg p-1 gap-1 border-0">
        <TabsTrigger value="overview" className="flex-1 rounded-md px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-muted-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
          {t('dashboard.overviewTab')}
        </TabsTrigger>
        <TabsTrigger value="wellness" className="flex-1 rounded-md px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-muted-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
          {t('dashboard.wellnessTab')}
        </TabsTrigger>
        {canSwitch && (
          <TabsTrigger value="personal" className="flex-1 rounded-md px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-muted-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
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
  );
}