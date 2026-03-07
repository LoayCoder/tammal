import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trophy, Calendar, MoreVertical, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { useAwardCycles, type AwardCycle, type CycleStatus } from '@/hooks/recognition/useAwardCycles';
import { CycleStatusBadge } from '@/components/recognition/CycleStatusBadge';
import { CycleTimeline } from '@/components/recognition/CycleTimeline';
import { CycleBuilder } from '@/components/recognition/CycleBuilder';
import { CycleEditDialog } from '@/components/recognition/CycleEditDialog';
import { CycleDeleteDialog } from '@/components/recognition/CycleDeleteDialog';
import { ConfirmDialog } from '@/shared/dialogs/ConfirmDialog';
import { useConfirmDelete } from '@/shared/dialogs/useConfirmDelete';
import { isInProcessStatus, getImpactWarning, getNextStatus } from '@/lib/recognition-utils';
import { format } from 'date-fns';

export default function RecognitionManagement() {
  const { t } = useTranslation();
  const { cycles, isPending, deleteCycle, advanceStatus } = useAwardCycles();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingCycle, setEditingCycle] = useState<AwardCycle | null>(null);

  // Impact alert state for in-process edit/delete
  const [impactAction, setImpactAction] = useState<{ type: 'edit' | 'delete'; cycle: AwardCycle } | null>(null);

  // Advance status confirmation
  const [advanceTarget, setAdvanceTarget] = useState<{ cycle: AwardCycle; nextStatus: CycleStatus } | null>(null);

  const { isOpen: isDeleteOpen, deleteId, requestDelete, setOpen: setDeleteOpen, confirm: confirmDeleteAction } = useConfirmDelete();

  const handleEditClick = (cycle: AwardCycle) => {
    if (isInProcessStatus(cycle.status)) {
      setImpactAction({ type: 'edit', cycle });
    } else {
      setEditingCycle(cycle);
    }
  };

  const handleDeleteClick = (cycle: AwardCycle) => {
    if (isInProcessStatus(cycle.status)) {
      setImpactAction({ type: 'delete', cycle });
    } else {
      requestDelete(cycle.id);
    }
  };

  const handleImpactProceed = () => {
    if (!impactAction) return;
    if (impactAction.type === 'edit') {
      setEditingCycle(impactAction.cycle);
    } else {
      requestDelete(impactAction.cycle.id);
    }
    setImpactAction(null);
  };

  const handleAdvanceClick = (cycle: AwardCycle) => {
    const nextStatus = getNextStatus(cycle.status);
    if (nextStatus) {
      setAdvanceTarget({ cycle, nextStatus });
    }
  };

  const handleAdvanceConfirm = () => {
    if (!advanceTarget) return;
    advanceStatus.mutate({
      id: advanceTarget.cycle.id,
      currentStatus: advanceTarget.cycle.status,
      newStatus: advanceTarget.nextStatus,
    });
    setAdvanceTarget(null);
  };


  if (showBuilder) {
    return (
      <div className="p-6">
        <CycleBuilder onClose={() => setShowBuilder(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            {t('recognition.title')}
          </h1>
          <p className="text-muted-foreground">{t('recognition.subtitle')}</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('recognition.cycles.create')}
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : cycles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t('recognition.cycles.empty')}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('recognition.cycles.emptyDescription')}</p>
            <Button className="mt-4" onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4 me-2" />
              {t('recognition.cycles.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cycles.map((cycle) => {
            const nextStatus = getNextStatus(cycle.status);
            return (
              <Card key={cycle.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cycle.name}</CardTitle>
                      <CardDescription>{t('recognition.cycles.createdAt', { date: format(new Date(cycle.created_at), 'MMM d, yyyy') })}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <CycleStatusBadge status={cycle.status as any} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {nextStatus && (
                            <>
                              <DropdownMenuItem onClick={() => handleAdvanceClick(cycle)}>
                                <ChevronRight className="h-4 w-4 me-2" />
                                {t('recognition.cycles.advanceTo', { status: t(`recognition.status.${nextStatus}`) })}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleEditClick(cycle)}>
                            <Pencil className="h-4 w-4 me-2" />
                            {t('recognition.cycles.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(cycle)}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t('recognition.cycles.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CycleTimeline cycle={cycle} />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{t('recognition.cycles.auditDaysLabel', { days: cycle.audit_review_days })}</span>
                      </div>
                    </div>
                    {nextStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdvanceClick(cycle)}
                      >
                        <ChevronRight className="h-3.5 w-3.5 me-1" />
                        {t('recognition.cycles.advanceTo', { status: t(`recognition.status.${nextStatus}`) })}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <CycleEditDialog
        cycle={editingCycle}
        open={!!editingCycle}
        onOpenChange={(open) => { if (!open) setEditingCycle(null); }}
      />

      {/* Delete Confirm with Impact Counts */}
      <CycleDeleteDialog
        cycleId={deleteId}
        cycleName={cycles.find(c => c.id === deleteId)?.name ?? ''}
        open={isDeleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => confirmDeleteAction((id) => deleteCycle.mutate(id))}
        loading={deleteCycle.isPending}
      />

      {/* Impact Alert for in-process cycles */}
      <ConfirmDialog
        open={!!impactAction}
        onOpenChange={(open) => { if (!open) setImpactAction(null); }}
        title={t('recognition.cycles.impactAlert.title')}
        description={
          impactAction
            ? `${impactAction.type === 'edit'
                ? t('recognition.cycles.impactAlert.editDescription')
                : t('recognition.cycles.impactAlert.deleteDescription')
              } ${getImpactWarning(impactAction.cycle.status, t) ?? ''}`
            : ''
        }
        confirmLabel={t('recognition.cycles.impactAlert.proceed')}
        cancelLabel={t('recognition.cycles.impactAlert.cancel')}
        onConfirm={handleImpactProceed}
        destructive={impactAction?.type === 'delete'}
      />

      {/* Advance Status Confirm */}
      <ConfirmDialog
        open={!!advanceTarget}
        onOpenChange={(open) => { if (!open) setAdvanceTarget(null); }}
        title={t('recognition.cycles.confirmAdvance')}
        description={
          advanceTarget
            ? t('recognition.cycles.confirmAdvanceDescription', {
                status: t(`recognition.status.${advanceTarget.nextStatus}`),
              })
            : ''
        }
        confirmLabel={t('recognition.cycles.advanceTo', {
          status: advanceTarget ? t(`recognition.status.${advanceTarget.nextStatus}`) : '',
        })}
        onConfirm={handleAdvanceConfirm}
        loading={advanceStatus.isPending}
        destructive={false}
      />
    </div>
  );
}
