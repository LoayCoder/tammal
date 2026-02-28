import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, ChevronRight, Pencil, Trash2, Crosshair } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useObjectives, type Objective } from '@/hooks/workload/useObjectives';
import { ObjectiveDialog } from '@/components/workload/ObjectiveDialog';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  on_track: 'bg-chart-2/15 text-chart-2 border-chart-2/30',
  at_risk: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  delayed: 'bg-destructive/15 text-destructive border-destructive/30',
  completed: 'bg-primary/15 text-primary border-primary/30',
};

export default function ObjectivesManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useTenantId();
  const {
    objectives, isPending, createObjective, updateObjective, deleteObjective,
    isCreating, isUpdating, isDeleting,
  } = useObjectives();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Objective | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const handleCreate = () => { setSelected(null); setDialogOpen(true); };
  const handleEdit = (obj: Objective) => { setSelected(obj); setDialogOpen(true); };
  const handleDelete = (id: string) => { setToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = () => { if (toDelete) { deleteObjective(toDelete); setDeleteDialogOpen(false); setToDelete(null); } };

  const handleSubmit = (data: any) => {
    if (selected) {
      updateObjective({ id: selected.id, ...data });
    } else {
      createObjective({ ...data, tenant_id: tenantId });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Target className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('workload.objectives.pageTitle')}</h1>
            <p className="text-muted-foreground text-sm">{t('workload.objectives.pageDesc')}</p>
          </div>
        </div>
        <Button onClick={handleCreate}><Plus className="me-2 h-4 w-4" />{t('workload.objectives.add')}</Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Card key={i} className="glass-card border-0 animate-pulse h-40" />)}</div>
      ) : objectives.length === 0 ? (
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Crosshair className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">{t('workload.objectives.empty')}</p>
            <Button variant="outline" className="mt-4" onClick={handleCreate}><Plus className="me-2 h-4 w-4" />{t('workload.objectives.add')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {objectives.map(obj => (
            <Card key={obj.id} className="glass-card border-0 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/admin/workload/objectives/${obj.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{obj.year} {obj.quarter}</Badge>
                      <Badge variant="outline" className={statusColors[obj.status] || ''}>{t(`workload.status.${obj.status}`)}</Badge>
                    </div>
                    <CardTitle className="text-lg leading-snug">{obj.title}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(obj)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(obj.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {obj.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{obj.description}</p>}
                <div className="flex items-center gap-3">
                  <Progress value={Number(obj.progress)} className="flex-1 h-2" />
                  <span className="text-sm font-medium text-muted-foreground">{Number(obj.progress).toFixed(0)}%</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground rtl:-scale-x-100" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ObjectiveDialog open={dialogOpen} onOpenChange={setDialogOpen} objective={selected} onSubmit={handleSubmit} isSubmitting={isCreating || isUpdating} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workload.objectives.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workload.objectives.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
