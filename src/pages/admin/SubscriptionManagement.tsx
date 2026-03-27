import { useTranslation } from 'react-i18next';
import { Plus, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/system';
import { Button } from '@/components/ui/button';
import { SubscriptionTable } from '@/components/subscriptions/SubscriptionTable';
import { SubscriptionDialog } from '@/components/subscriptions/SubscriptionDialog';
import { ConfirmDialog } from '@/shared/dialogs/ConfirmDialog';
import { useFormDialog } from '@/shared/dialogs/useFormDialog';
import { useConfirmDelete } from '@/shared/dialogs/useConfirmDelete';
import { useSubscriptions, type Subscription } from '@/hooks/org/useSubscriptions';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';
import { cardVariants } from "@/theme/tokens";

export default function SubscriptionManagement() {
  const { t } = useTranslation();
  const {
    subscriptions,
    isPending: isLoading,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    isCreating,
    isUpdating,
  } = useSubscriptions();

  const formDialog = useFormDialog<Subscription>();
  const confirmDelete = useConfirmDelete();

  const handleSubmit = (data: any) => {
    if (formDialog.selected) {
      updateSubscription({ id: formDialog.selected.id, ...data });
    } else {
      createSubscription(data);
    }
    formDialog.close();
  };

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <PageHeader
        icon={<CreditCard className="h-5 w-5 text-primary" />}
        title={t('subscriptions.title')}
        variant="card"
        actions={
          <Button onClick={formDialog.openCreate}>
            <Plus className="h-4 w-4 me-2" />
            {t('subscriptions.addSubscription')}
          </Button>
        }
      />

      <Card className={cardVariants.glass}>
        <CardHeader>
          <CardTitle>{t('subscriptions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionTable
            subscriptions={subscriptions}
            isLoading={isLoading}
            onEdit={formDialog.openEdit}
            onDelete={confirmDelete.requestDelete}
          />
        </CardContent>
      </Card>

      <SubscriptionDialog
        open={formDialog.isOpen}
        onOpenChange={formDialog.setOpen}
        subscription={formDialog.selected}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={confirmDelete.isOpen}
        onOpenChange={confirmDelete.setOpen}
        title={t('subscriptions.deleteSubscription')}
        description={t('subscriptions.confirmDelete')}
        onConfirm={() => confirmDelete.confirm(deleteSubscription)}
      />
    </div>
    </ErrorBoundary>
  );
}
