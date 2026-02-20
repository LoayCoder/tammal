import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardView } from '@/hooks/useDashboardView';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { DashboardOverviewTab } from '@/components/dashboard/DashboardOverviewTab';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';
import { Building2, Heart, User } from 'lucide-react';
import EmployeeHome from './EmployeeHome';

export default function Dashboard() {
  const { t } = useTranslation();
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
    <Tabs value={view} onValueChange={(v) => setView(v as any)} className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview" className="gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('dashboard.overviewTab')}</span>
        </TabsTrigger>
        <TabsTrigger value="wellness" className="gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('dashboard.wellnessTab')}</span>
        </TabsTrigger>
        {canSwitch && (
          <TabsTrigger value="personal" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.personalTab')}</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview">
        <DashboardOverviewTab isSuperAdmin={isSuperAdmin} />
      </TabsContent>

      <TabsContent value="wellness">
        <OrgDashboard />
      </TabsContent>

      {canSwitch && (
        <TabsContent value="personal">
          <EmployeeHome />
        </TabsContent>
      )}
    </Tabs>
  );
}
