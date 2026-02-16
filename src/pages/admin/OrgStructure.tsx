import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Network, Building2, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartments, type Department, type DepartmentInput } from '@/hooks/useDepartments';
import { useBranches, type Branch, type BranchInput } from '@/hooks/useBranches';
import { useSites, type Site, type SiteInput } from '@/hooks/useSites';
import { useEmployees } from '@/hooks/useEmployees';
import { useProfile } from '@/hooks/useProfile';
import { DepartmentTable } from '@/components/org/DepartmentTable';
import { DepartmentSheet } from '@/components/org/DepartmentSheet';
import { BranchTable } from '@/components/org/BranchTable';
import { BranchSheet } from '@/components/org/BranchSheet';
import { SiteTable } from '@/components/org/SiteTable';
import { SiteSheet } from '@/components/org/SiteSheet';

export default function OrgStructure() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id || '';

  const { departments, isLoading: deptsLoading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { branches, isLoading: branchesLoading, createBranch, updateBranch, deleteBranch } = useBranches();
  const { sites, isLoading: sitesLoading, createSite, updateSite, deleteSite } = useSites();
  const { employees } = useEmployees();

  // Department state
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Division (Branch) state
  const [branchSheetOpen, setBranchSheetOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Section (Site) state
  const [siteSheetOpen, setSiteSheetOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const handleDeptSubmit = (data: DepartmentInput) => {
    if (editingDept) {
      updateDepartment.mutate({ id: editingDept.id, ...data });
    } else {
      createDepartment.mutate(data);
    }
  };

  const handleBranchSubmit = (data: BranchInput) => {
    if (editingBranch) {
      updateBranch.mutate({ id: editingBranch.id, ...data });
    } else {
      createBranch.mutate(data);
    }
  };

  const handleSiteSubmit = (data: SiteInput) => {
    if (editingSite) {
      updateSite.mutate({ id: editingSite.id, ...data });
    } else {
      createSite.mutate(data);
    }
  };

  const isLoading = deptsLoading || branchesLoading || sitesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('organization.title')}</h1>
        <p className="text-muted-foreground">{t('organization.subtitle')}</p>
      </div>

      <Tabs defaultValue="divisions">
        <TabsList>
          <TabsTrigger value="divisions" className="gap-2">
            <Network className="h-4 w-4" /> {t('divisions.title')}
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" /> {t('organization.departments')}
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <Layers className="h-4 w-4" /> {t('sections.title')}
          </TabsTrigger>
        </TabsList>

        {/* Divisions Tab (Top of hierarchy) */}
        <TabsContent value="divisions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('divisions.title')}</CardTitle>
              <Button onClick={() => { setEditingBranch(null); setBranchSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('divisions.addDivision')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <BranchTable
                  branches={branches}
                  departments={departments}
                  onEdit={(branch) => { setEditingBranch(branch); setBranchSheetOpen(true); }}
                  onDelete={(id) => deleteBranch.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab (Middle of hierarchy) */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('organization.departments')}</CardTitle>
              <Button onClick={() => { setEditingDept(null); setDeptSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('organization.addDepartment')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <DepartmentTable
                  departments={departments}
                  branches={branches}
                  employees={employees as any}
                  onEdit={(dept) => { setEditingDept(dept); setDeptSheetOpen(true); }}
                  onDelete={(id) => deleteDepartment.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab (Bottom of hierarchy) */}
        <TabsContent value="sections">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('sections.title')}</CardTitle>
              <Button onClick={() => { setEditingSite(null); setSiteSheetOpen(true); }}>
                <Plus className="me-2 h-4 w-4" /> {t('sections.addSection')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <SiteTable
                  sites={sites}
                  branches={branches}
                  departments={departments}
                  onEdit={(site) => { setEditingSite(site); setSiteSheetOpen(true); }}
                  onDelete={(id) => deleteSite.mutate(id)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheets */}
      <DepartmentSheet
        open={deptSheetOpen}
        onOpenChange={setDeptSheetOpen}
        department={editingDept}
        departments={departments}
        branches={branches}
        employees={employees as any}
        tenantId={tenantId}
        onSubmit={handleDeptSubmit}
      />
      <BranchSheet
        open={branchSheetOpen}
        onOpenChange={setBranchSheetOpen}
        branch={editingBranch}
        tenantId={tenantId}
        onSubmit={handleBranchSubmit}
      />
      <SiteSheet
        open={siteSheetOpen}
        onOpenChange={setSiteSheetOpen}
        site={editingSite}
        departments={departments}
        branches={branches}
        tenantId={tenantId}
        onSubmit={handleSiteSubmit}
      />
    </div>
  );
}
