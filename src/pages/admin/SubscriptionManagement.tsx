import { useTranslation } from 'react-i18next';
import { Plus, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubscriptionTable } from '@/components/subscriptions/SubscriptionTable';
import { SubscriptionDialog } from '@/components/subscriptions/SubscriptionDialog';
import { ConfirmDialog } from '@/shared/dialogs/ConfirmDialog';
import { useFormDialog } from '@/shared/dialogs/useFormDialog';
import { useConfirmDelete } from '@/shared/dialogs/useConfirmDelete';
import { useSubscriptions, type Subscription } from '@/hooks/useSubscriptions';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';

export default function SubscriptionManagement() {
  const { t } = useTranslation();
  const {
    subscriptions,
    isLoading,
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
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><CreditCard className="h-6 w-6 text-primary" /></div>
          <h1 className="text-3xl font-bold tracking-tight">{t('subscriptions.title')}</h1>
        </div>
        <Button onClick={formDialog.openCreate}>
          <Plus className="h-4 w-4 me-2" />
          {t('subscriptions.addSubscription')}
        </Button>
      </div>

      <Card className="glass-card border-0 rounded-xl">
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
