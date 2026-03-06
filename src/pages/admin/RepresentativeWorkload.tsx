import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Users, CheckCircle2, Clock, AlertTriangle, Download, Upload,
  Target, Crosshair, Pencil, Trash2, ArrowRight, Rocket, FolderOpen,
  Lock, Unlock,
} from 'lucide-react';
import { useRepresentativeTasks } from '@/hooks/workload/useRepresentativeTasks';
import { DistributeTaskDialog } from '@/components/workload/representative/DistributeTaskDialog';
import { BatchDetailDialog } from '@/components/workload/representative/BatchDetailDialog';
import { BulkImportDialog } from '@/components/workload/representative/BulkImportDialog';
import { downloadTemplate } from '@/components/workload/representative/csvTemplate';
import { useOrgTree } from '@/hooks/org/useOrgTree';
import { useObjectives, type Objective } from '@/hooks/workload/useObjectives';
import { useInitiatives, type Initiative } from '@/hooks/workload/useInitiatives';
import { useActions, type ObjAction } from '@/hooks/workload/useActions';
import { ObjectiveDialog } from '@/components/workload/ObjectiveDialog';
import { InitiativeDialog } from '@/components/workload/InitiativeDialog';
import { ActionDialog } from '@/components/workload/ActionDialog';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';

const statusColors: Record<string, string> = {
  on_track: 'bg-chart-2/15 text-chart-2 border-chart-2/30',
  at_risk: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  delayed: 'bg-destructive/15 text-destructive border-destructive/30',
  completed: 'bg-primary/15 text-primary border-primary/30',
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-chart-1/15 text-chart-1',
  on_hold: 'bg-chart-4/15 text-chart-4',
  scheduled: 'bg-primary/15 text-primary',
  blocked: 'bg-destructive/15 text-destructive',
};

export default function RepresentativeWorkload() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  // Task distribution state
  const { assignments, tasks, isLoadingTasks, isLoadingAssignments, distributeTask, isDistributing, bulkDistribute, isBulkDistributing } = useRepresentativeTasks();
  const { divisions, departments, sites } = useOrgTree();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<{ id: string; title: string } | null>(null);

  // Strategic hierarchy state
  const { objectives, isPending: objLoading, createObjective, updateObjective, deleteObjective, lockObjective, unlockObjective, isCreating: objCreating, isUpdating: objUpdating, isDeleting: objDeleting } = useObjectives();
  const [objDialogOpen, setObjDialogOpen] = useState(false);
  const [selectedObj, setSelectedObj] = useState<Objective | null>(null);
  const [deleteObjDialog, setDeleteObjDialog] = useState(false);
  const [objToDelete, setObjToDelete] = useState<string | null>(null);

  // Expanded objective for initiatives
  const [expandedObjId, setExpandedObjId] = useState<string | null>(null);

  // Initiative state
  const { initiatives, isPending: initLoading, createInitiative, updateInitiative, deleteInitiative, lockInitiative, unlockInitiative, isCreating: initCreating, isUpdating: initUpdating, isDeleting: initDeleting } = useInitiatives(expandedObjId || undefined);
  const [initDialogOpen, setInitDialogOpen] = useState(false);
  const [selectedInit, setSelectedInit] = useState<Initiative | null>(null);
  const [deleteInitDialog, setDeleteInitDialog] = useState(false);
  const [initToDelete, setInitToDelete] = useState<string | null>(null);

  // Expanded initiative for actions
  const [expandedInitId, setExpandedInitId] = useState<string | null>(null);
  const { actions, createAction, updateAction, deleteAction, lockAction, unlockAction, isCreating: actCreating, isUpdating: actUpdating, isDeleting: actDeleting } = useActions(expandedInitId || undefined);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ObjAction | null>(null);
  const [actionInitId, setActionInitId] = useState<string>('');
  const [deleteActionDialog, setDeleteActionDialog] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);

  // Batch grouping for task distribution tab
  const batches = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const batchId = task.source_id ?? 'unknown';
      if (!map.has(batchId)) map.set(batchId, []);
      map.get(batchId)!.push(task);
    }
    return Array.from(map.entries()).map(([batchId, batchTasks]) => ({
      batchId,
      title: batchTasks[0]?.title ?? '',
      due_date: batchTasks[0]?.due_date,
      total: batchTasks.length,
      done: batchTasks.filter(t => t.status === 'done').length,
      inProgress: batchTasks.filter(t => t.status === 'in_progress').length,
      blocked: batchTasks.filter(t => t.status === 'blocked').length,
      createdAt: batchTasks[0]?.created_at,
    }));
  }, [tasks]);

  const getScopeName = (a: typeof assignments[0]) => {
    if (a.scope_type === 'division') return divisions.find(d => d.id === a.scope_id)?.name;
    if (a.scope_type === 'department') return departments.find(d => d.id === a.scope_id)?.name;
    if (a.scope_type === 'section') return sites.find(s => s.id === a.scope_id)?.name;
    return a.scope_id;
  };

  // Objective handlers
  const handleObjSubmit = (data: any) => {
    if (selectedObj) updateObjective({ id: selectedObj.id, ...data });
    else createObjective({ ...data, tenant_id: tenantId });
    setObjDialogOpen(false);
  };
  const confirmDeleteObj = () => { if (objToDelete) { deleteObjective(objToDelete); setDeleteObjDialog(false); setObjToDelete(null); } };

  // Initiative handlers
  const handleInitSubmit = (data: any) => {
    if (selectedInit) updateInitiative({ id: selectedInit.id, ...data } as any);
    else createInitiative({ ...data, tenant_id: tenantId } as any);
    setInitDialogOpen(false);
  };
  const confirmDeleteInit = () => { if (initToDelete) { deleteInitiative(initToDelete); setDeleteInitDialog(false); setInitToDelete(null); } };

  // Action handlers
  const handleActionSubmit = (data: any) => {
    if (selectedAction) updateAction({ id: selectedAction.id, ...data } as any);
    else createAction({ ...data, tenant_id: tenantId } as any);
    setActionDialogOpen(false);
  };
  const confirmDeleteAction = () => { if (actionToDelete) { deleteAction(actionToDelete); setDeleteActionDialog(false); setActionToDelete(null); } };

  if (isLoadingAssignments || isLoadingTasks) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('representative.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('representative.pageDesc')}</p>
        </div>
      </div>

      {/* Scope assignments */}
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
          <TabsTrigger value="strategic">
            <Target className="h-4 w-4 me-2" />
            {t('representative.tabs.strategic')}
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <Users className="h-4 w-4 me-2" />
            {t('representative.tabs.distribution')}
          </TabsTrigger>
        </TabsList>

        {/* ─── Strategic Objectives Tab ─── */}
        <TabsContent value="strategic" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t('workload.objectives.pageTitle')}
            </h2>
            <Button onClick={() => { setSelectedObj(null); setObjDialogOpen(true); }}>
              <Plus className="me-2 h-4 w-4" />{t('workload.objectives.add')}
            </Button>
          </div>

          {objLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : objectives.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Crosshair className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p>{t('workload.objectives.empty')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {objectives.map(obj => {
                const isObjExpanded = expandedObjId === obj.id;
                return (
                  <Card key={obj.id} className="rounded-xl">
                    {/* Objective header */}
                    <CardHeader
                      className="pb-2 cursor-pointer"
                      onClick={() => {
                        setExpandedObjId(isObjExpanded ? null : obj.id);
                        setExpandedInitId(null);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ArrowRight className={`h-4 w-4 transition-transform rtl:-scale-x-100 ${isObjExpanded ? 'rotate-90' : ''}`} />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="outline" className="text-xs">{obj.year} {obj.quarter}</Badge>
                              <Badge variant="outline" className={statusColors[obj.status] || ''}>{t(`workload.status.${obj.status}`)}</Badge>
                              {obj.is_locked && (
                                <Badge variant="outline" className="bg-chart-4/15 text-chart-4 gap-1">
                                  <Lock className="h-3 w-3" />{t('workload.lock.locked')}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base">{obj.title}</CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Progress value={Number(obj.progress)} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground w-8">{Number(obj.progress).toFixed(0)}%</span>
                          {/* Lock/Unlock */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => obj.is_locked ? unlockObjective(obj.id) : lockObjective({ id: obj.id, locked_by: userId })}>
                                {obj.is_locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{obj.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent>
                          </Tooltip>
                          {!obj.is_locked && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedObj(obj); setObjDialogOpen(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setObjToDelete(obj.id); setDeleteObjDialog(true); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Expanded: Initiatives */}
                    {isObjExpanded && (
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center justify-between mt-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-primary" />{t('workload.initiatives.sectionTitle')}
                          </h3>
                          {!obj.is_locked && (
                            <Button variant="outline" size="sm" onClick={() => { setSelectedInit(null); setInitDialogOpen(true); }}>
                              <Plus className="me-1 h-3.5 w-3.5" />{t('workload.initiatives.add')}
                            </Button>
                          )}
                        </div>

                        {initLoading ? (
                          <Skeleton className="h-16" />
                        ) : initiatives.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                            {t('workload.initiatives.empty')}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {initiatives.map(init => {
                              const isInitExpanded = expandedInitId === init.id;
                              return (
                                <Card key={init.id} className="border">
                                  <CardHeader
                                    className="py-3 cursor-pointer"
                                    onClick={() => setExpandedInitId(isInitExpanded ? null : init.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <ArrowRight className={`h-3.5 w-3.5 transition-transform rtl:-scale-x-100 ${isInitExpanded ? 'rotate-90' : ''}`} />
                                        <span className="text-sm font-medium">{init.title}</span>
                                        {init.is_locked && <Lock className="h-3 w-3 text-chart-4" />}
                                      </div>
                                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <Badge variant="outline" className={`text-xs ${statusColors[init.status] || ''}`}>{t(`workload.status.${init.status}`)}</Badge>
                                        <Progress value={Number(init.progress)} className="w-16 h-1.5" />
                                        <span className="text-xs text-muted-foreground">{Number(init.progress).toFixed(0)}%</span>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"
                                              onClick={() => init.is_locked ? unlockInitiative(init.id) : lockInitiative({ id: init.id, locked_by: userId })}>
                                              {init.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{init.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent>
                                        </Tooltip>
                                        {!init.is_locked && (
                                          <>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedInit(init); setInitDialogOpen(true); }}>
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { setInitToDelete(init.id); setDeleteInitDialog(true); }}>
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </CardHeader>

                                  {/* Expanded: Actions */}
                                  {isInitExpanded && (
                                    <CardContent className="pt-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-medium text-muted-foreground">{t('workload.actions.sectionTitle')}</h4>
                                        {!init.is_locked && (
                                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelectedAction(null); setActionInitId(init.id); setActionDialogOpen(true); }}>
                                            <Plus className="me-1 h-3 w-3" />{t('workload.actions.add')}
                                          </Button>
                                        )}
                                      </div>
                                      {actions.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-3">{t('workload.actions.empty')}</p>
                                      ) : (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs">{t('workload.actions.title')}</TableHead>
                                              <TableHead className="text-xs w-16">{t('workload.actions.priority')}</TableHead>
                                              <TableHead className="text-xs w-20">{t('workload.actions.estimatedHours')}</TableHead>
                                              <TableHead className="text-xs w-24">{t('common.status')}</TableHead>
                                              <TableHead className="text-xs w-24">{t('common.actions')}</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {actions.map(act => (
                                              <TableRow key={act.id}>
                                                <TableCell className="text-sm font-medium">
                                                  <div className="flex items-center gap-1.5">
                                                    {act.title}
                                                    {act.is_locked && <Lock className="h-3 w-3 text-chart-4" />}
                                                  </div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline" className="text-xs">P{act.priority}</Badge></TableCell>
                                                <TableCell className="text-xs">{Number(act.estimated_hours)}h</TableCell>
                                                <TableCell><Badge variant="outline" className={`text-xs ${statusColors[act.status] || ''}`}>{t(`workload.status.${act.status}`)}</Badge></TableCell>
                                                <TableCell>
                                                  <div className="flex gap-0.5">
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6"
                                                          onClick={() => act.is_locked ? unlockAction(act.id) : lockAction({ id: act.id, locked_by: userId })}>
                                                          {act.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                                        </Button>
                                                      </TooltipTrigger>
                                                      <TooltipContent>{act.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent>
                                                    </Tooltip>
                                                    {!act.is_locked && (
                                                      <>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedAction(act); setActionInitId(init.id); setActionDialogOpen(true); }}>
                                                          <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { setActionToDelete(act.id); setDeleteActionDialog(true); }}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      </>
                                                    )}
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      )}
                                    </CardContent>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Strategic Dialogs */}
          <ObjectiveDialog open={objDialogOpen} onOpenChange={setObjDialogOpen} objective={selectedObj} onSubmit={handleObjSubmit} isSubmitting={objCreating || objUpdating} />
          {expandedObjId && (
            <InitiativeDialog open={initDialogOpen} onOpenChange={setInitDialogOpen} initiative={selectedInit} objectiveId={expandedObjId} onSubmit={handleInitSubmit} isSubmitting={initCreating || initUpdating} />
          )}
          <ActionDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen} action={selectedAction} initiativeId={actionInitId} onSubmit={handleActionSubmit} isSubmitting={actCreating || actUpdating} />

          {/* Delete confirmations */}
          <AlertDialog open={deleteObjDialog} onOpenChange={setDeleteObjDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('workload.objectives.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('workload.objectives.deleteDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteObj} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={objDeleting}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog open={deleteInitDialog} onOpenChange={setDeleteInitDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('workload.initiatives.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('workload.initiatives.deleteDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteInit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={initDeleting}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog open={deleteActionDialog} onOpenChange={setDeleteActionDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('workload.actions.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('workload.actions.deleteDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={actDeleting}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ─── Task Distribution Tab ─── */}
        <TabsContent value="distribution" className="space-y-4 mt-4">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 me-2" />
              {t('representative.downloadTemplate')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 me-2" />
              {t('representative.bulkImport')}
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 me-2" />
              {t('representative.assignTask')}
            </Button>
          </div>

          {batches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>{t('representative.noBatches')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {batches.map(batch => {
                const completion = batch.total > 0 ? Math.round((batch.done / batch.total) * 100) : 0;
                return (
                  <Card
                    key={batch.batchId}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedBatch({ id: batch.batchId, title: batch.title })}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{batch.title}</CardTitle>
                      {batch.due_date && (
                        <CardDescription className="text-xs">
                          {t('representative.dueDate')}: {new Date(batch.due_date).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> {batch.total}</span>
                        <span className="flex items-center gap-1 text-chart-1"><CheckCircle2 className="h-3 w-3" /> {batch.done}</span>
                        <span className="flex items-center gap-1 text-chart-4"><Clock className="h-3 w-3" /> {batch.inProgress}</span>
                        {batch.blocked > 0 && (
                          <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> {batch.blocked}</span>
                        )}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${completion}%` }} />
                      </div>
                      <p className="text-xs text-end text-muted-foreground">{completion}%</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <DistributeTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} assignments={assignments} onSubmit={distributeTask} isSubmitting={isDistributing} />
          <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} onSubmit={bulkDistribute} isSubmitting={isBulkDistributing} />
          <BatchDetailDialog open={!!selectedBatch} onOpenChange={(open) => { if (!open) setSelectedBatch(null); }} batchId={selectedBatch?.id ?? null} batchTitle={selectedBatch?.title ?? ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
