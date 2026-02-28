import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Network, Building2, Layers, GitBranch, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartments, type Department, type DepartmentInput } from '@/hooks/org/useDepartments';
import { useBranches, type Branch, type BranchInput } from '@/hooks/org/useBranches';
import { useSites, type Site, type SiteInput } from '@/hooks/org/useSites';
import { useDivisions, type Division, type DivisionInput } from '@/hooks/org/useDivisions';
import { useWorkSites, type WorkSite, type WorkSiteInput } from '@/hooks/org/useWorkSites';
import { useEmployees } from '@/hooks/org/useEmployees';
import { useProfile } from '@/hooks/auth/useProfile';
import { DepartmentTable } from '@/components/org/DepartmentTable';
import { DepartmentSheet } from '@/components/org/DepartmentSheet';
import { BranchTable } from '@/components/org/BranchTable';
import { BranchSheet } from '@/components/org/BranchSheet';
import { SiteTable } from '@/components/org/SiteTable';
import { SiteSheet } from '@/components/org/SiteSheet';
import { DivisionTable } from '@/components/org/DivisionTable';
import { DivisionSheet } from '@/components/org/DivisionSheet';
import { WorkSiteTable } from '@/components/org/WorkSiteTable';
import { WorkSiteSheet } from '@/components/org/WorkSiteSheet';

export default function OrgStructure() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || '';

  const { departments, isLoading: deptsLoading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { branches, isLoading: branchesLoading, createBranch, updateBranch, deleteBranch } = useBranches();
  const { sites, isLoading: sitesLoading, createSite, updateSite, deleteSite } = useSites();
  const { divisions, isLoading: divisionsLoading, createDivision, updateDivision, deleteDivision } = useDivisions();
  const { workSites, isLoading: workSitesLoading, createWorkSite, updateWorkSite, deleteWorkSite } = useWorkSites();
  const { employees } = useEmployees();

  // Branch state
  const [branchSheetOpen, setBranchSheetOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Division state
  const [divisionSheetOpen, setDivisionSheetOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);

  // Department state
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Section (Site) state
  const [siteSheetOpen, setSiteSheetOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // Work Site state
  const [workSiteSheetOpen, setWorkSiteSheetOpen] = useState(false);
  const [editingWorkSite, setEditingWorkSite] = useState<WorkSite | null>(null);

  const handleBranchSubmit = (data: BranchInput) => {
    if (editingBranch) {
      updateBranch.mutate({ id: editingBranch.id, ...data });
    } else {
      createBranch.mutate(data);
    }
  };

  const handleDivisionSubmit = (data: DivisionInput) => {
    if (editingDivision) {
      updateDivision.mutate({ id: editingDivision.id, ...data });
    } else {
      createDivision.mutate(data);
    }
  };

  const handleDeptSubmit = (data: DepartmentInput) => {
    if (editingDept) {
      updateDepartment.mutate({ id: editingDept.id, ...data });
    } else {
      createDepartment.mutate(data);
    }
  };

  const handleSiteSubmit = (data: SiteInput) => {
    if (editingSite) {
      updateSite.mutate({ id: editingSite.id, ...data });
    } else {
      createSite.mutate(data);
    }
  };

  const handleWorkSiteSubmit = (data: WorkSiteInput) => {
    if (editingWorkSite) {
      updateWorkSite.mutate({ id: editingWorkSite.id, ...data });
    } else {
      createWorkSite.mutate(data);
    }
  };

  const isLoading = deptsLoading || branchesLoading || sitesLoading || divisionsLoading || workSitesLoading;

  const loadingSkeleton = (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );

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

        {/* Branches Tab */}
        <TabsContent value="branches">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('branches.title')}</CardTitle>
              <Button onClick={() => { setEditingBranch(null); setBranchSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('branches.addBranch')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? loadingSkeleton : (
                <BranchTable
                  branches={branches}
                  onEdit={(branch) => { setEditingBranch(branch); setBranchSheetOpen(true); }}
                  onDelete={(id) => deleteBranch.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Divisions Tab */}
        <TabsContent value="divisions">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('divisions.title')}</CardTitle>
              <Button onClick={() => { setEditingDivision(null); setDivisionSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('divisions.addDivision')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? loadingSkeleton : (
                <DivisionTable
                  divisions={divisions}
                  departments={departments}
                  sites={sites}
                  employees={employees as any}
                  onEdit={(div) => { setEditingDivision(div); setDivisionSheetOpen(true); }}
                  onDelete={(id) => deleteDivision.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('organization.departments')}</CardTitle>
              <Button onClick={() => { setEditingDept(null); setDeptSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('organization.addDepartment')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? loadingSkeleton : (
                <DepartmentTable
                  departments={departments}
                  divisions={divisions}
                  sites={sites}
                  employees={employees as any}
                  onEdit={(dept) => { setEditingDept(dept); setDeptSheetOpen(true); }}
                  onDelete={(id) => deleteDepartment.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('sections.title')}</CardTitle>
              <Button onClick={() => { setEditingSite(null); setSiteSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('sections.addSection')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? loadingSkeleton : (
                <SiteTable
                  sites={sites}
                  branches={branches}
                  departments={departments}
                  divisions={divisions}
                  employees={employees as any}
                  onEdit={(site) => { setEditingSite(site); setSiteSheetOpen(true); }}
                  onDelete={(id) => deleteSite.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Sites Tab */}
        <TabsContent value="sites">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('workSites.title')}</CardTitle>
              <Button onClick={() => { setEditingWorkSite(null); setWorkSiteSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('workSites.addSite')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? loadingSkeleton : (
                <WorkSiteTable
                  workSites={workSites}
                  departments={departments}
                  sections={sites}
                  onEdit={(ws) => { setEditingWorkSite(ws); setWorkSiteSheetOpen(true); }}
                  onDelete={(id) => deleteWorkSite.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheets */}
      <BranchSheet
        open={branchSheetOpen}
        onOpenChange={setBranchSheetOpen}
        branch={editingBranch}
        tenantId={tenantId}
        onSubmit={handleBranchSubmit}
      />
      <DivisionSheet
        open={divisionSheetOpen}
        onOpenChange={setDivisionSheetOpen}
        division={editingDivision}
        employees={employees as any}
        tenantId={tenantId}
        onSubmit={handleDivisionSubmit}
      />
      <DepartmentSheet
        open={deptSheetOpen}
        onOpenChange={setDeptSheetOpen}
        department={editingDept}
        divisions={divisions}
        employees={employees as any}
        tenantId={tenantId}
        onSubmit={handleDeptSubmit}
      />
      <SiteSheet
        open={siteSheetOpen}
        onOpenChange={setSiteSheetOpen}
        site={editingSite}
        departments={departments}
        branches={branches}
        employees={employees as any}
        tenantId={tenantId}
        onSubmit={handleSiteSubmit}
      />
      <WorkSiteSheet
        open={workSiteSheetOpen}
        onOpenChange={setWorkSiteSheetOpen}
        workSite={editingWorkSite}
        departments={departments}
        sections={sites}
        tenantId={tenantId}
        onSubmit={handleWorkSiteSubmit}
      />
    </div>
  );
}
