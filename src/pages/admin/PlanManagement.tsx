import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';
import { PageHeader } from '@/components/system';
import { usePlansManagement, type Plan } from '@/hooks/org/usePlans';
import { PlanTable } from '@/components/plans/PlanTable';
import { PlanDialog } from '@/components/plans/PlanDialog';
import { ConfirmDialog } from '@/shared/dialogs/ConfirmDialog';
import { useFormDialog } from '@/shared/dialogs/useFormDialog';
import { useConfirmDelete } from '@/shared/dialogs/useConfirmDelete';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';
import { cardVariants } from "@/theme/tokens";

export default function PlanManagement() {
  const { t } = useTranslation();
  const {
    plans,
    isPending: isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePlansManagement();

  const formDialog = useFormDialog<Plan>();
  const confirmDelete = useConfirmDelete();

  const handleSubmit = (data: any) => {
    if (formDialog.selected) {
      updatePlan({ id: formDialog.selected.id, ...data });
    } else {
      createPlan(data);
    }
    formDialog.close();
  };

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <PageHeader
        icon={<Layers className="h-5 w-5 text-primary" />}
        title={t('plans.title')}
        variant="card"
        actions={
          <Button onClick={formDialog.openCreate}>
            <Plus className="me-2 h-4 w-4" />
            {t('plans.addPlan')}
          </Button>
        }
      />

      <Card className={cardVariants.glass}>
        <CardHeader>
          <CardTitle>{t('plans.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanTable
            plans={plans}
            isLoading={isLoading}
            onEdit={formDialog.openEdit}
            onDelete={confirmDelete.requestDelete}
          />
        </CardContent>
      </Card>

      <PlanDialog
        open={formDialog.isOpen}
        onOpenChange={formDialog.setOpen}
        plan={formDialog.selected}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={confirmDelete.isOpen}
        onOpenChange={confirmDelete.setOpen}
        title={t('plans.deletePlan')}
        description={t('plans.confirmDelete')}
        onConfirm={() => confirmDelete.confirm(deletePlan)}
        loading={isDeleting}
      />
    </div>
    </ErrorBoundary>
  );
}
