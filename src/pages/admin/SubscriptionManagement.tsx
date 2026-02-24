import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { SubscriptionTable } from '@/components/subscriptions/SubscriptionTable';
import { SubscriptionDialog } from '@/components/subscriptions/SubscriptionDialog';
import { useSubscriptions, type Subscription } from '@/hooks/useSubscriptions';

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedSubscription(null);
    setDialogOpen(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSubscriptionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (subscriptionToDelete) {
      deleteSubscription(subscriptionToDelete);
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedSubscription) {
      updateSubscription({ id: selectedSubscription.id, ...data });
    } else {
      createSubscription(data);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><CreditCard className="h-6 w-6 text-primary" /></div>
          <h1 className="text-3xl font-bold tracking-tight">{t('subscriptions.title')}</h1>
        </div>
        <Button onClick={handleCreate}>
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
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={selectedSubscription}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('subscriptions.deleteSubscription')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('subscriptions.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
