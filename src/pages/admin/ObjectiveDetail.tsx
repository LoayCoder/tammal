import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, ArrowRight, Pencil, Trash2, ChevronLeft, Rocket, FolderOpen, Lock, Unlock } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useObjectives, type Objective } from '@/hooks/workload/useObjectives';
import { useInitiatives, type Initiative } from '@/hooks/workload/useInitiatives';
import { useActions, type ObjAction } from '@/hooks/workload/useActions';
import { InitiativeDialog } from '@/components/workload/InitiativeDialog';
import { ActionDialog } from '@/components/workload/ActionDialog';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const statusColors: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-chart-1/15 text-chart-1',
  completed: 'bg-chart-2/15 text-chart-2',
  on_hold: 'bg-chart-4/15 text-chart-4',
  on_track: 'bg-chart-2/15 text-chart-2',
  at_risk: 'bg-chart-4/15 text-chart-4',
  delayed: 'bg-destructive/15 text-destructive',
  scheduled: 'bg-primary/15 text-primary',
  blocked: 'bg-destructive/15 text-destructive',
};

export default function ObjectiveDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useTenantId();
  const { user } = useAuth();
  const { objectives, isPending: objLoading, lockObjective, unlockObjective } = useObjectives();
  const {
    initiatives, isPending: initLoading, createInitiative, updateInitiative, deleteInitiative,
    lockInitiative, unlockInitiative,
    isCreating: initCreating, isUpdating: initUpdating, isDeleting: initDeleting,
  } = useInitiatives(id);

  const objective = objectives.find(o => o.id === id);

  const [initDialogOpen, setInitDialogOpen] = useState(false);
  const [selectedInit, setSelectedInit] = useState<Initiative | null>(null);
  const [deleteInitDialog, setDeleteInitDialog] = useState(false);
  const [initToDelete, setInitToDelete] = useState<string | null>(null);

  const [expandedInitiative, setExpandedInitiative] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ObjAction | null>(null);
  const [actionInitId, setActionInitId] = useState<string>('');
  const [deleteActionDialog, setDeleteActionDialog] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);

  const {
    actions, createAction, updateAction, deleteAction,
    lockAction, unlockAction,
    isCreating: actCreating, isUpdating: actUpdating, isDeleting: actDeleting,
  } = useActions(expandedInitiative || undefined);

  if (objLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>;
  if (!objective) return <div className="text-center py-12 text-muted-foreground">{t('common.noData')}</div>;

  const handleInitSubmit = (data: any) => {
    if (selectedInit) updateInitiative({ id: selectedInit.id, ...data });
    else createInitiative({ ...data, tenant_id: tenantId });
    setInitDialogOpen(false);
  };

  const handleActionSubmit = (data: any) => {
    if (selectedAction) updateAction({ id: selectedAction.id, ...data });
    else createAction({ ...data, tenant_id: tenantId });
    setActionDialogOpen(false);
  };

  const userId = user?.id ?? '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card border-0 rounded-xl p-6">
        <Button variant="ghost" size="sm" className="mb-3 -ms-2" onClick={() => navigate('/admin/workload/objectives')}>
          <ChevronLeft className="h-4 w-4 me-1 rtl:-scale-x-100" />{t('common.back')}
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{objective.year} {objective.quarter}</Badge>
              <Badge variant="outline" className={statusColors[objective.status] || ''}>{t(`workload.status.${objective.status}`)}</Badge>
              {objective.is_locked && (
                <Badge variant="outline" className="bg-chart-4/15 text-chart-4 gap-1">
                  <Lock className="h-3 w-3" />{t('workload.lock.locked')}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{objective.title}</h1>
            {objective.description && <p className="text-muted-foreground mt-1">{objective.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => objective.is_locked ? unlockObjective(objective.id) : lockObjective({ id: objective.id, locked_by: userId })}>
                  {objective.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{objective.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent>
            </Tooltip>
            <div className="text-end">
              <span className="text-3xl font-bold">{Number(objective.progress).toFixed(0)}%</span>
              <Progress value={Number(objective.progress)} className="w-32 h-2 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('workload.lock.autoCalculated')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Initiatives Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" />{t('workload.initiatives.sectionTitle')}</h2>
        {!objective.is_locked && (
          <Button onClick={() => { setSelectedInit(null); setInitDialogOpen(true); }}><Plus className="me-2 h-4 w-4" />{t('workload.initiatives.add')}</Button>
        )}
      </div>

      {initLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : initiatives.length === 0 ? (
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{t('workload.initiatives.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {initiatives.map(init => {
            const isExpanded = expandedInitiative === init.id;
            return (
              <Card key={init.id} className="glass-card border-0 rounded-xl">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedInitiative(isExpanded ? null : init.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowRight className={`h-4 w-4 transition-transform rtl:-scale-x-100 ${isExpanded ? 'rotate-90' : ''}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CardTitle className="text-base">{init.title}</CardTitle>
                          {init.is_locked && <Lock className="h-3.5 w-3.5 text-chart-4" />}
                        </div>
                        {init.description && <p className="text-xs text-muted-foreground mt-0.5">{init.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Badge variant="outline" className={statusColors[init.status] || ''}>{t(`workload.status.${init.status}`)}</Badge>
                      <Progress value={Number(init.progress)} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground w-8">{Number(init.progress).toFixed(0)}%</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => init.is_locked ? unlockInitiative(init.id) : lockInitiative({ id: init.id, locked_by: userId })}>
                            {init.is_locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{init.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent>
                      </Tooltip>
                      {!init.is_locked && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedInit(init); setInitDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setInitToDelete(init.id); setDeleteInitDialog(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3 mt-2">
                      <h3 className="text-sm font-medium text-muted-foreground">{t('workload.actions.sectionTitle')}</h3>
                      {!init.is_locked && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedAction(null); setActionInitId(init.id); setActionDialogOpen(true); }}>
                          <Plus className="me-1 h-3.5 w-3.5" />{t('workload.actions.add')}
                        </Button>
                      )}
                    </div>
                    {actions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('workload.actions.empty')}</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('workload.actions.title')}</TableHead>
                            <TableHead className="w-16">{t('workload.actions.priority')}</TableHead>
                            <TableHead className="w-20">{t('workload.actions.estimatedHours')}</TableHead>
                            <TableHead className="w-24">{t('common.status')}</TableHead>
                            <TableHead className="w-24">{t('common.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {actions.map(act => (
                            <TableRow key={act.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1.5">
                                  {act.title}
                                  {act.is_locked && <Lock className="h-3 w-3 text-chart-4" />}
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="outline">P{act.priority}</Badge></TableCell>
                              <TableCell>{Number(act.estimated_hours)}h</TableCell>
                              <TableCell><Badge variant="outline" className={statusColors[act.status] || ''}>{t(`workload.status.${act.status}`)}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => act.is_locked ? unlockAction(act.id) : lockAction({ id: act.id, locked_by: userId })}>
                                        {act.is_locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{act.is_locked ? t('workload.lock.unlock') : t('workload.lock.lock')}</TooltipContent>
                                  </Tooltip>
                                  {!act.is_locked && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedAction(act); setActionInitId(init.id); setActionDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setActionToDelete(act.id); setDeleteActionDialog(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      {/* Dialogs */}
      <InitiativeDialog open={initDialogOpen} onOpenChange={setInitDialogOpen} initiative={selectedInit} objectiveId={id!} onSubmit={handleInitSubmit} isSubmitting={initCreating || initUpdating} />
      <ActionDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen} action={selectedAction} initiativeId={actionInitId} onSubmit={handleActionSubmit} isSubmitting={actCreating || actUpdating} />

      <AlertDialog open={deleteInitDialog} onOpenChange={setDeleteInitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('workload.initiatives.deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('workload.initiatives.deleteDesc')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (initToDelete) { deleteInitiative(initToDelete); setDeleteInitDialog(false); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={initDeleting}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteActionDialog} onOpenChange={setDeleteActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('workload.actions.deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('workload.actions.deleteDesc')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (actionToDelete) { deleteAction(actionToDelete); setDeleteActionDialog(false); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={actDeleting}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
