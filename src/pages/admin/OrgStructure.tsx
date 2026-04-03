import { useTranslation } from 'react-i18next';
import { Network, Building2, Layers, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/hooks/auth/useProfile';
import { useDepartments } from '@/hooks/org/useDepartments';
import { useBranches } from '@/hooks/org/useBranches';
import { useSites } from '@/hooks/org/useSites';
import { useDivisions } from '@/hooks/org/useDivisions';
import { useWorkSites } from '@/hooks/org/useWorkSites';
import { BranchesTab } from '@/components/org/tabs/BranchesTab';
import { DivisionsTab } from '@/components/org/tabs/DivisionsTab';
import { DepartmentsTab } from '@/components/org/tabs/DepartmentsTab';
import { SectionsTab } from '@/components/org/tabs/SectionsTab';
import { WorkSitesTab } from '@/components/org/tabs/WorkSitesTab';

export default function OrgStructure() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || '';

  const { isPending: deptsLoading } = useDepartments();
  const { isPending: branchesLoading } = useBranches();
  const { isPending: sitesLoading } = useSites();
  const { isPending: divisionsLoading } = useDivisions();
  const { isPending: workSitesLoading } = useWorkSites();

  const isLoading = deptsLoading || branchesLoading || sitesLoading || divisionsLoading || workSitesLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Network className="h-5 w-5 text-primary" />}
        title={t('organization.title')}
        subtitle={t('organization.subtitle')}
        variant="card"
      />

      <Tabs defaultValue="branches">
        <TabsList className="glass-tabs flex-wrap">
          <TabsTrigger value="branches" className="gap-2 rounded-xl">
            <Network className="h-4 w-4" /> {t('branches.title')}
          </TabsTrigger>
          <TabsTrigger value="divisions" className="gap-2 rounded-xl">
            <Network className="h-4 w-4" /> {t('divisions.title')}
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2 rounded-xl">
            <Building2 className="h-4 w-4" /> {t('organization.departments')}
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2 rounded-xl">
            <Layers className="h-4 w-4" /> {t('sections.title')}
          </TabsTrigger>
          <TabsTrigger value="sites" className="gap-2 rounded-xl">
            <MapPin className="h-4 w-4" /> {t('workSites.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <BranchesTab tenantId={tenantId} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="divisions">
          <DivisionsTab tenantId={tenantId} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentsTab tenantId={tenantId} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="sections">
          <SectionsTab tenantId={tenantId} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="sites">
          <WorkSitesTab tenantId={tenantId} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
