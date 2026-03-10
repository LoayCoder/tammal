import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ArrowRight, Rocket, FolderOpen, Lock, Unlock, Target, Crosshair } from 'lucide-react';
import type { Objective } from '@/features/workload/hooks/useObjectives';
import type { Initiative } from '@/features/workload/hooks/useInitiatives';
import type { ObjAction } from '@/features/workload/hooks/useActions';
import { ObjectiveDialog } from '@/components/workload/ObjectiveDialog';
import { InitiativeDialog } from '@/components/workload/InitiativeDialog';
import { ActionDialog } from '@/components/workload/ActionDialog';

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

interface StrategicHierarchyTabProps {
  objectives: Objective[];
  objLoading: boolean;
  initiatives: Initiative[];
  initLoading: boolean;
  actions: ObjAction[];
  tenantId: string | undefined;
  userId: string;
  // Objective operations
  createObjective: (data: any) => void;
  updateObjective: (data: any) => void;
  deleteObjective: (id: string) => void;
  lockObjective: (data: { id: string; locked_by: string }) => void;
  unlockObjective: (id: string) => void;
  objCreating: boolean;
  objUpdating: boolean;
  objDeleting: boolean;
  // Initiative operations
  createInitiative: (data: any) => void;
  updateInitiative: (data: any) => void;
  deleteInitiative: (id: string) => void;
  lockInitiative: (data: { id: string; locked_by: string }) => void;
  unlockInitiative: (id: string) => void;
  initCreating: boolean;
  initUpdating: boolean;
  initDeleting: boolean;
  // Action operations
  createAction: (data: any) => void;
  updateAction: (data: any) => void;
  deleteAction: (id: string) => void;
  lockAction: (data: { id: string; locked_by: string }) => void;
  unlockAction: (id: string) => void;
  actCreating: boolean;
  actUpdating: boolean;
  actDeleting: boolean;
  // Expanded state
  expandedObjId: string | null;
  onExpandObj: (id: string | null) => void;
  expandedInitId: string | null;
  onExpandInit: (id: string | null) => void;
}

export function StrategicHierarchyTab({
  objectives, objLoading, initiatives, initLoading, actions,
  tenantId, userId,
  createObjective, updateObjective, deleteObjective, lockObjective, unlockObjective, objCreating, objUpdating, objDeleting,
  createInitiative, updateInitiative, deleteInitiative, lockInitiative, unlockInitiative, initCreating, initUpdating, initDeleting,
  createAction, updateAction, deleteAction, lockAction, unlockAction, actCreating, actUpdating, actDeleting,
  expandedObjId, onExpandObj, expandedInitId, onExpandInit,
}: StrategicHierarchyTabProps) {
  const { t } = useTranslation();

  const [objDialogOpen, setObjDialogOpen] = useState(false);
  const [selectedObj, setSelectedObj] = useState<Objective | null>(null);
  const [deleteObjDialog, setDeleteObjDialog] = useState(false);
  const [objToDelete, setObjToDelete] = useState<string | null>(null);

  const [initDialogOpen, setInitDialogOpen] = useState(false);
  const [selectedInit, setSelectedInit] = useState<Initiative | null>(null);
  const [deleteInitDialog, setDeleteInitDialog] = useState(false);
  const [initToDelete, setInitToDelete] = useState<string | null>(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ObjAction | null>(null);
  const [actionInitId, setActionInitId] = useState('');
  const [deleteActionDialog, setDeleteActionDialog] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);

  const handleObjSubmit = (data: any) => {
    if (selectedObj) updateObjective({ id: selectedObj.id, ...data });
    else createObjective({ ...data, tenant_id: tenantId });
    setObjDialogOpen(false);
  };
  const confirmDeleteObj = () => { if (objToDelete) { deleteObjective(objToDelete); setDeleteObjDialog(false); setObjToDelete(null); } };

  const handleInitSubmit = (data: any) => {
    if (selectedInit) updateInitiative({ id: selectedInit.id, ...data } as any);
    else createInitiative({ ...data, tenant_id: tenantId } as any);
    setInitDialogOpen(false);
  };
  const confirmDeleteInit = () => { if (initToDelete) { deleteInitiative(initToDelete); setDeleteInitDialog(false); setInitToDelete(null); } };

  const handleActionSubmit = (data: any) => {
    if (selectedAction) updateAction({ id: selectedAction.id, ...data } as any);
    else createAction({ ...data, tenant_id: tenantId } as any);
    setActionDialogOpen(false);
  };
  const confirmDeleteAction = () => { if (actionToDelete) { deleteAction(actionToDelete); setDeleteActionDialog(false); setActionToDelete(null); } };

  return (
    <div className="space-y-4">
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
                <CardHeader className="pb-2 cursor-pointer" onClick={() => { onExpandObj(isObjExpanded ? null : obj.id); onExpandInit(null); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowRight className={`h-4 w-4 transition-transform rtl:-scale-x-100 ${isObjExpanded ? 'rotate-90' : ''}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-xs">{obj.year} {obj.quarter}</Badge>
                          <Badge variant="outline" className={statusColors[obj.status] || ''}>{t(`workload.status.${obj.status}`)}</Badge>
                          {obj.is_locked && <Badge variant="outline" className="bg-chart-4/15 text-chart-4 gap-1"><Lock className="h-3 w-3" />{t('workload.lock.locked')}</Badge>}
                        </div>
                        <CardTitle className="text-base">{obj.title}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Progress value={Number(obj.progress)} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground w-8">{Number(obj.progress).toFixed(0)}%</span>
                      <Tooltip><TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => obj.is_locked ? unlockObjective(obj.id) : lockObjective({ id: obj.id, locked_by: userId })}>
                          {obj.is_locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger><TooltipContent>{obj.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent></Tooltip>
                      {!obj.is_locked && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedObj(obj); setObjDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setObjToDelete(obj.id); setDeleteObjDialog(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isObjExpanded && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between mt-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" />{t('workload.initiatives.sectionTitle')}</h3>
                      {!obj.is_locked && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedInit(null); setInitDialogOpen(true); }}>
                          <Plus className="me-1 h-3.5 w-3.5" />{t('workload.initiatives.add')}
                        </Button>
                      )}
                    </div>

                    {initLoading ? <Skeleton className="h-16" /> : initiatives.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4"><FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />{t('workload.initiatives.empty')}</p>
                    ) : (
                      <div className="space-y-2">
                        {initiatives.map(init => {
                          const isInitExpanded = expandedInitId === init.id;
                          return (
                            <Card key={init.id} className="border">
                              <CardHeader className="py-3 cursor-pointer" onClick={() => onExpandInit(isInitExpanded ? null : init.id)}>
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
                                    <Tooltip><TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => init.is_locked ? unlockInitiative(init.id) : lockInitiative({ id: init.id, locked_by: userId })}>
                                        {init.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                      </Button>
                                    </TooltipTrigger><TooltipContent>{init.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent></Tooltip>
                                    {!init.is_locked && (
                                      <>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedInit(init); setInitDialogOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { setInitToDelete(init.id); setDeleteInitDialog(true); }}><Trash2 className="h-3 w-3" /></Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

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
                                              <div className="flex items-center gap-1.5">{act.title}{act.is_locked && <Lock className="h-3 w-3 text-chart-4" />}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline" className="text-xs">P{act.priority}</Badge></TableCell>
                                            <TableCell className="text-xs">{Number(act.estimated_hours)}h</TableCell>
                                            <TableCell><Badge variant="outline" className={`text-xs ${statusColors[act.status] || ''}`}>{t(`workload.status.${act.status}`)}</Badge></TableCell>
                                            <TableCell>
                                              <div className="flex gap-0.5">
                                                <Tooltip><TooltipTrigger asChild>
                                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => act.is_locked ? unlockAction(act.id) : lockAction({ id: act.id, locked_by: userId })}>
                                                    {act.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                                  </Button>
                                                </TooltipTrigger><TooltipContent>{act.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent></Tooltip>
                                                {!act.is_locked && (
                                                  <>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedAction(act); setActionInitId(init.id); setActionDialogOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { setActionToDelete(act.id); setDeleteActionDialog(true); }}><Trash2 className="h-3 w-3" /></Button>
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

      {/* Dialogs */}
      <ObjectiveDialog open={objDialogOpen} onOpenChange={setObjDialogOpen} objective={selectedObj} onSubmit={handleObjSubmit} isSubmitting={objCreating || objUpdating} />
      {expandedObjId && <InitiativeDialog open={initDialogOpen} onOpenChange={setInitDialogOpen} initiative={selectedInit} objectiveId={expandedObjId} onSubmit={handleInitSubmit} isSubmitting={initCreating || initUpdating} />}
      <ActionDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen} action={selectedAction} initiativeId={actionInitId} onSubmit={handleActionSubmit} isSubmitting={actCreating || actUpdating} />

      <AlertDialog open={deleteObjDialog} onOpenChange={setDeleteObjDialog}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('workload.objectives.deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('workload.objectives.deleteDesc')}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteObj} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={objDeleting}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteInitDialog} onOpenChange={setDeleteInitDialog}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('workload.initiatives.deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('workload.initiatives.deleteDesc')}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteInit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={initDeleting}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteActionDialog} onOpenChange={setDeleteActionDialog}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('workload.actions.deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('workload.actions.deleteDesc')}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={actDeleting}>{t('common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
