import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useCycleImpactCounts } from '@/features/recognition/hooks/recognition/useCycleImpactCounts';
import { Trophy, Users, Vote } from 'lucide-react';

interface CycleDeleteDialogProps {
  cycleId: string | null;
  cycleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const CycleDeleteDialog = React.memo(function CycleDeleteDialog({
  cycleId,
  cycleName,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: CycleDeleteDialogProps) {
  const { t } = useTranslation();
  const { data: counts, isPending: countsLoading } = useCycleImpactCounts(open ? cycleId : null);

  const hasImpact = counts && (counts.themes > 0 || counts.nominations > 0 || counts.votes > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('recognition.cycles.confirmDelete')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('recognition.cycles.confirmDeleteDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {countsLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : hasImpact ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <p className="text-sm font-medium text-destructive">
              {t('recognition.cycles.deleteImpact.heading')}
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {counts.themes > 0 && (
                <li className="flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-destructive/70" />
                  {t('recognition.cycles.deleteImpact.themes', { count: counts.themes })}
                </li>
              )}
              {counts.nominations > 0 && (
                <li className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-destructive/70" />
                  {t('recognition.cycles.deleteImpact.nominations', { count: counts.nominations })}
                </li>
              )}
              {counts.votes > 0 && (
                <li className="flex items-center gap-2">
                  <Vote className="h-3.5 w-3.5 text-destructive/70" />
                  {t('recognition.cycles.deleteImpact.votes', { count: counts.votes })}
                </li>
              )}
            </ul>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading || countsLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});


