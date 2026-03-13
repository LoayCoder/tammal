import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNominationApprovals } from '@/features/recognition/hooks/recognition/useNominationApprovals';
import { ManagerApprovalCard } from '@/features/recognition/components/ManagerApprovalCard';
import type { CriterionEvaluation } from '@/features/recognition/components/CriteriaEvaluationForm';
import { useEmployeeNames, useNominationCriteriaEvaluations } from '../hooks/useRecognitionQueries';

export default function NominationApprovalsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pendingApprovals, isPending, approveNomination, rejectNomination } = useNominationApprovals();

  // Resolve employee names for nominees and nominators
  const allUserIds = [
    ...new Set(pendingApprovals.flatMap(n => [n.nominee_id, n.nominator_id]))
  ] as string[];

  const { data: employeeMap = {} } = useEmployeeNames(allUserIds);

  // Fetch criteria evaluations for all pending nominations
  const nominationIds = pendingApprovals.map(n => n.id);

  const { data: criteriaEvalMap = {} } = useNominationCriteriaEvaluations(nominationIds);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {t('recognition.nominations.managerApproval')}
          </h1>
          <p className="text-muted-foreground">{t('recognition.nominations.requiresManagerApproval')}</p>
        </div>
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('recognition.nominations.noPendingApprovals')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingApprovals.map(n => (
            <ManagerApprovalCard
              key={n.id}
              nomination={n}
              nomineeName={employeeMap[n.nominee_id]}
              nominatorName={employeeMap[n.nominator_id]}
              criteriaEvaluations={criteriaEvalMap[n.id]}
              onApprove={(id, adj, endorserIds) => approveNomination.mutate({ id, criteriaAdjustments: adj, additionalEndorserIds: endorserIds })}
              onReject={(id, reason) => rejectNomination.mutate({ id, reason })}
              isApproving={approveNomination.isPending}
              isRejecting={rejectNomination.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}



