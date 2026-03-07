import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNominationApprovals } from '@/hooks/recognition/useNominationApprovals';
import { ManagerApprovalCard } from '@/components/recognition/ManagerApprovalCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CriterionEvaluation } from '@/components/recognition/CriteriaEvaluationForm';

export default function NominationApprovalsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pendingApprovals, isPending, approveNomination, rejectNomination } = useNominationApprovals();

  // Resolve employee names for nominees and nominators
  const allUserIds = [
    ...new Set(pendingApprovals.flatMap(n => [n.nominee_id, n.nominator_id]))
  ];

  const { data: employeeMap = {} } = useQuery({
    queryKey: ['employee-names', allUserIds],
    queryFn: async () => {
      if (!allUserIds.length) return {};
      const { data } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .in('user_id', allUserIds)
        .is('deleted_at', null);
      const map: Record<string, string> = {};
      data?.forEach(e => { if (e.user_id) map[e.user_id] = e.full_name; });
      return map;
    },
    enabled: allUserIds.length > 0,
  });

  // Fetch criteria evaluations for all pending nominations
  const nominationIds = pendingApprovals.map(n => n.id);

  const { data: criteriaEvalMap = {} } = useQuery({
    queryKey: ['nomination-criteria-evals', nominationIds],
    queryFn: async () => {
      if (!nominationIds.length) return {};
      const { data } = await supabase
        .from('nomination_criteria_evaluations')
        .select('*, judging_criteria:criterion_id(name, name_ar, description)')
        .in('nomination_id', nominationIds)
        .is('deleted_at', null);

      const map: Record<string, CriterionEvaluation[]> = {};
      data?.forEach((row: any) => {
        if (!map[row.nomination_id]) map[row.nomination_id] = [];
        map[row.nomination_id].push({
          criterion_id: row.criterion_id,
          name: row.judging_criteria?.name || '',
          name_ar: row.judging_criteria?.name_ar || null,
          description: row.judging_criteria?.description || null,
          weight: Number(row.weight),
          justification: row.justification || '',
        });
      });
      return map;
    },
    enabled: nominationIds.length > 0,
  });

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
              onApprove={(id, adj) => approveNomination.mutate({ id, criteriaAdjustments: adj })}
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
