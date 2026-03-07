import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NominationCard } from '@/components/recognition/NominationCard';
import { ManagerApprovalCard } from '@/components/recognition/ManagerApprovalCard';
import { useNominations } from '@/hooks/recognition/useNominations';
import { useNominationApprovals } from '@/hooks/recognition/useNominationApprovals';
import { useHasRole } from '@/hooks/auth/useUserPermissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Plus, Send, Inbox, ShieldCheck } from 'lucide-react';

export default function MyNominationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { myNominations, receivedNominations, myPending, receivedPending } = useNominations();
  const { hasRole: isManager } = useHasRole('manager');
  const { hasRole: isTenantAdmin } = useHasRole('tenant_admin');
  const { pendingApprovals, isPending: approvalsPending, approveNomination, rejectNomination } = useNominationApprovals();
  const [tab, setTab] = useState('sent');

  const showApprovalsTab = isManager || isTenantAdmin;

  // Resolve employee names for approval cards
  const allApprovalUserIds = [
    ...new Set(pendingApprovals.flatMap(n => [n.nominee_id, n.nominator_id]))
  ];

  const { data: employeeMap = {} } = useQuery({
    queryKey: ['employee-names-approvals', allApprovalUserIds],
    queryFn: async () => {
      if (!allApprovalUserIds.length) return {};
      const { data } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .in('user_id', allApprovalUserIds)
        .is('deleted_at', null);
      const map: Record<string, string> = {};
      data?.forEach(e => { if (e.user_id) map[e.user_id] = e.full_name; });
      return map;
    },
    enabled: allApprovalUserIds.length > 0 && showApprovalsTab,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            {t('recognition.nominations.myNominations')}
          </h1>
          <p className="text-muted-foreground">{t('recognition.nominations.myNominationsDesc')}</p>
        </div>
        <Button onClick={() => navigate('/recognition/nominate')}>
          <Plus className="h-4 w-4 me-2" />
          {t('recognition.nominations.nominate')}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sent" className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {t('recognition.nominations.sent')} ({myNominations.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-1.5">
            <Inbox className="h-3.5 w-3.5" />
            {t('recognition.nominations.received')} ({receivedNominations.length})
          </TabsTrigger>
          {showApprovalsTab && (
            <TabsTrigger value="approvals" className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('recognition.nominations.managerApproval')} ({pendingApprovals.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="sent" className="mt-4">
          {myPending ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : myNominations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('recognition.nominations.noSent')}</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate('/recognition/nominate')}>
                  {t('recognition.nominations.nominate')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {myNominations.map(n => (
                <NominationCard key={n.id} nomination={n} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          {receivedPending ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : receivedNominations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('recognition.nominations.noReceived')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {receivedNominations.map(n => (
                <NominationCard key={n.id} nomination={n} />
              ))}
            </div>
          )}
        </TabsContent>

        {showApprovalsTab && (
          <TabsContent value="approvals" className="mt-4">
            {approvalsPending ? (
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
                    onApprove={(id, adj) => approveNomination.mutate({ id, criteriaAdjustments: adj })}
                    onReject={(id, reason) => rejectNomination.mutate({ id, reason })}
                    isApproving={approveNomination.isPending}
                    isRejecting={rejectNomination.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
