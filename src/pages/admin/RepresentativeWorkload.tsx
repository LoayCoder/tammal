import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, Target } from 'lucide-react';
import { useRepresentativeTasks, useObjectives, useInitiatives, useActions } from '@/features/workload';
import { useOrgTree } from '@/hooks/org/useOrgTree';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';
import { StrategicHierarchyTab } from '@/components/workload/representative/StrategicHierarchyTab';
import { TaskDistributionTab } from '@/components/workload/representative/TaskDistributionTab';

export default function RepresentativeWorkload() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const { assignments, tasks, isLoadingTasks, isLoadingAssignments, distributeTask, isDistributing, bulkDistribute, isBulkDistributing } = useRepresentativeTasks();
  const { divisions, departments, sites } = useOrgTree();

  const [expandedObjId, setExpandedObjId] = useState<string | null>(null);
  const [expandedInitId, setExpandedInitId] = useState<string | null>(null);

  const { objectives, isPending: objLoading, createObjective, updateObjective, deleteObjective, lockObjective, unlockObjective, isCreating: objCreating, isUpdating: objUpdating, isDeleting: objDeleting } = useObjectives();
  const { initiatives, isPending: initLoading, createInitiative, updateInitiative, deleteInitiative, lockInitiative, unlockInitiative, isCreating: initCreating, isUpdating: initUpdating, isDeleting: initDeleting } = useInitiatives(expandedObjId || undefined);
  const { actions, createAction, updateAction, deleteAction, lockAction, unlockAction, isCreating: actCreating, isUpdating: actUpdating, isDeleting: actDeleting } = useActions(expandedInitId || undefined);

  const getScopeName = (a: typeof assignments[0]) => {
    if (a.scope_type === 'division') return divisions.find(d => d.id === a.scope_id)?.name;
    if (a.scope_type === 'department') return departments.find(d => d.id === a.scope_id)?.name;
    if (a.scope_type === 'section') return sites.find(s => s.id === a.scope_id)?.name;
    return a.scope_id;
  };

  if (isLoadingAssignments || isLoadingTasks) {
    return <div className="space-y-6 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('representative.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('representative.pageDesc')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {assignments.map(a => (
          <Badge key={a.id} variant="secondary" className="gap-1.5 py-1 px-3">
            <Users className="h-3.5 w-3.5" />
            {t(`representative.scopeTypes.${a.scope_type}`)} — {getScopeName(a) ?? a.scope_id}
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="strategic" className="w-full">
        <TabsList>
          <TabsTrigger value="strategic"><Target className="h-4 w-4 me-2" />{t('representative.tabs.strategic')}</TabsTrigger>
          <TabsTrigger value="distribution"><Users className="h-4 w-4 me-2" />{t('representative.tabs.distribution')}</TabsTrigger>
        </TabsList>

        <TabsContent value="strategic" className="space-y-4 mt-4">
          <StrategicHierarchyTab
            objectives={objectives} objLoading={objLoading}
            initiatives={initiatives} initLoading={initLoading}
            actions={actions} tenantId={tenantId} userId={userId}
            createObjective={createObjective} updateObjective={updateObjective} deleteObjective={deleteObjective}
            lockObjective={lockObjective} unlockObjective={unlockObjective}
            objCreating={objCreating} objUpdating={objUpdating} objDeleting={objDeleting}
            createInitiative={createInitiative} updateInitiative={updateInitiative} deleteInitiative={deleteInitiative}
            lockInitiative={lockInitiative} unlockInitiative={unlockInitiative}
            initCreating={initCreating} initUpdating={initUpdating} initDeleting={initDeleting}
            createAction={createAction} updateAction={updateAction} deleteAction={deleteAction}
            lockAction={lockAction} unlockAction={unlockAction}
            actCreating={actCreating} actUpdating={actUpdating} actDeleting={actDeleting}
            expandedObjId={expandedObjId} onExpandObj={setExpandedObjId}
            expandedInitId={expandedInitId} onExpandInit={setExpandedInitId}
          />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4 mt-4">
          <TaskDistributionTab
            tasks={tasks} assignments={assignments}
            distributeTask={distributeTask} isDistributing={isDistributing}
            bulkDistribute={bulkDistribute} isBulkDistributing={isBulkDistributing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
