import { useTranslation } from 'react-i18next';
import { Network, Building2, Layers, GitBranch, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useProfile } from '@/features/auth/hooks/auth/useProfile';
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
      <div className="glass-card border-0 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Network className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('organization.title')}</h1>
            <p className="text-muted-foreground">{t('organization.subtitle')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="branches">
        <TabsList className="glass-tabs flex-wrap">
          <TabsTrigger value="branches" className="gap-2 rounded-xl">
            <GitBranch className="h-4 w-4" /> {t('branches.title')}
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

