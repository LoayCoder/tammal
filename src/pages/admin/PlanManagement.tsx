import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePlansManagement, type Plan } from '@/hooks/usePlans';
import { PlanTable } from '@/components/plans/PlanTable';
import { PlanDialog } from '@/components/plans/PlanDialog';

export default function PlanManagement() {
  const { t } = useTranslation();
  const {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePlansManagement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPlanToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      deletePlan(planToDelete);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedPlan) {
      updatePlan({ id: selectedPlan.id, ...data });
    } else {
      createPlan(data);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Layers className="h-6 w-6 text-primary" /></div>
          <h1 className="text-3xl font-bold tracking-tight">{t('plans.title')}</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="me-2 h-4 w-4" />
          {t('plans.addPlan')}
        </Button>
      </div>

      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle>{t('plans.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanTable
            plans={plans}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('plans.deletePlan')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('plans.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
