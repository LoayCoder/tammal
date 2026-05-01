import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NominationCard } from '@/components/recognition/NominationCard';
import { NominationEditDialog } from '@/components/recognition/NominationEditDialog';
import { ManagerApprovalCard } from '@/components/recognition/ManagerApprovalCard';
import { NominationDetailDialog } from '@/components/recognition/NominationDetailDialog';
import { useNominations } from '@/hooks/recognition/useNominations';
import { useNominationApprovals } from '@/hooks/recognition/useNominationApprovals';
import { useEndorsements } from '@/hooks/recognition/useEndorsements';
import { useHasRole } from '@/hooks/auth/useUserPermissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Plus, Send, Inbox, ShieldCheck, ThumbsUp } from 'lucide-react';
import type { Nomination } from '@/hooks/recognition/useNominations';
import { PageHeader } from '@/components/system';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';

export default function MyNominationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { myNominations, receivedNominations, myPending, receivedPending, updateNomination, softDelete } = useNominations();
  const { hasRole: isManager } = useHasRole('manager');
  const { hasRole: isTenantAdmin } = useHasRole('tenant_admin');
  const { pendingApprovals, isPending: approvalsPending, approveNomination, rejectNomination } = useNominationApprovals();
  const { myEndorsementRequests, requestsPending } = useEndorsements();
  const [tab, setTab] = useState(searchParams.get('tab') || 'sent');
  const [selectedNomination, setSelectedNomination] = useState<Nomination | null>(null);
  const [editingNomination, setEditingNomination] = useState<Nomination | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showApprovalsTab = isManager || isTenantAdmin;
  const nominationMetrics = [
    {
      label: 'Submitted',
      value: myNominations.length,
      detail: `${myNominations.filter((nomination) => nomination.status === 'submitted').length} awaiting outcome`,
      tone: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]',
    },
    {
      label: 'Received',
      value: receivedNominations.length,
      detail: `${receivedNominations.filter((nomination) => nomination.manager_approval_status === 'approved').length} approved recognitions`,
      tone: 'bg-[rgba(59,130,246,0.14)] text-[#93C5FD]',
    },
    {
      label: 'Endorsements',
      value: myEndorsementRequests.length,
      detail: `${myEndorsementRequests.filter((nomination) => nomination.manager_approval_status === 'approved' || nomination.manager_approval_status === 'not_required').length} ready for peer proof`,
      tone: 'bg-[rgba(245,158,11,0.14)] text-[#FBBF24]',
    },
    {
      label: 'Approvals',
      value: pendingApprovals.length,
      detail: showApprovalsTab ? 'Manager queue requiring decisions' : 'Visible to approvers only',
      tone: 'bg-[rgba(139,92,246,0.14)] text-[#C4B5FD]',
    },
  ];

  // Resolve employee names for approval cards + endorsement requests
  const allUserIds = [
    ...new Set([
      ...pendingApprovals.flatMap(n => [n.nominee_id, n.nominator_id]),
      ...myNominations.flatMap(n => [n.nominee_id, n.nominator_id]),
      ...receivedNominations.flatMap(n => [n.nominee_id, n.nominator_id]),
      ...myEndorsementRequests.flatMap(n => [n.nominee_id]),
    ]),
  ];

  const { data: employeeMap = {} } = useQuery({
    queryKey: ['employee-names-nominations', allUserIds],
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy className="h-5 w-5 text-primary" />}
        title={t('recognition.nominations.myNominations')}
        subtitle={t('recognition.nominations.myNominationsDesc')}
        variant="card"
        actions={
          <Button onClick={() => navigate('/recognition/nominate')}>
            <Plus className="h-4 w-4 me-2" />
            {t('recognition.nominations.nominate')}
          </Button>
        }
      />

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Recognition summary</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Track momentum, approval posture, and social proof</h2>
          </div>
          <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
            Enterprise recognition workflow
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {nominationMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{metric.label}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${metric.tone}`}>
                  Live
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">{metric.value}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{metric.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <ErrorBoundary title={t('common.sectionError')} description={t('common.sectionErrorDescription')}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
          <TabsTrigger value="sent" className="flex items-center gap-1.5 rounded-xl border border-transparent px-4 data-[state=active]:border-[var(--border-default)] data-[state=active]:bg-[var(--bg-surface-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none">
            <Send className="h-3.5 w-3.5" />
            {t('recognition.nominations.sent')} ({myNominations.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-1.5 rounded-xl border border-transparent px-4 data-[state=active]:border-[var(--border-default)] data-[state=active]:bg-[var(--bg-surface-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none">
            <Inbox className="h-3.5 w-3.5" />
            {t('recognition.nominations.received')} ({receivedNominations.length})
          </TabsTrigger>
          <TabsTrigger value="endorse" className="flex items-center gap-1.5 rounded-xl border border-transparent px-4 data-[state=active]:border-[var(--border-default)] data-[state=active]:bg-[var(--bg-surface-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none">
            <ThumbsUp className="h-3.5 w-3.5" />
            {t('recognition.endorsements.endorseTab')} ({myEndorsementRequests.length})
          </TabsTrigger>
          {showApprovalsTab && (
            <TabsTrigger value="approvals" className="flex items-center gap-1.5 rounded-xl border border-transparent px-4 data-[state=active]:border-[var(--border-default)] data-[state=active]:bg-[var(--bg-surface-elevated)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-none">
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
                <div key={n.id} className="cursor-pointer" onClick={() => setSelectedNomination(n)}>
                  <NominationCard
                    nomination={n}
                    nomineeName={employeeMap[n.nominee_id]}
                    showActions
                    onEdit={() => setEditingNomination(n)}
                    onDelete={() => setDeletingId(n.id)}
                  />
                </div>
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
                <div key={n.id} className="cursor-pointer" onClick={() => setSelectedNomination(n)}>
                  <NominationCard
                    nomination={n}
                    nominatorName={employeeMap[n.nominator_id]}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="endorse" className="mt-4">
          {requestsPending ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : myEndorsementRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ThumbsUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('recognition.endorsements.noEndorseRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {myEndorsementRequests.map(n => (
                <Card
                  key={n.id}
                  className="cursor-pointer rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--border-default)]"
                  onClick={() => setSelectedNomination(n as unknown as Nomination)}
                >
                  <CardContent className="space-y-3 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{n.headline}</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">Provide peer context to strengthen recognition proof.</p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
                        Request
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.justification}</p>
                    {employeeMap[n.nominee_id] && (
                      <p className="text-xs text-muted-foreground">
                        {t('recognition.nominations.nominee')}: {employeeMap[n.nominee_id]}
                      </p>
                    )}
                    <Button variant="outline" size="sm" className="mt-1 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
                      <ThumbsUp className="h-3.5 w-3.5 me-1.5" />
                      {t('recognition.endorsements.submitEndorsement')}
                    </Button>
                  </CardContent>
                </Card>
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
      </ErrorBoundary>

      {/* Detail dialog */}
      <NominationDetailDialog
        nomination={selectedNomination}
        open={!!selectedNomination}
        onOpenChange={(open) => { if (!open) setSelectedNomination(null); }}
        nomineeName={selectedNomination ? employeeMap[selectedNomination.nominee_id] : undefined}
        nominatorName={selectedNomination ? employeeMap[selectedNomination.nominator_id] : undefined}
      />

      {/* Edit dialog */}
      <NominationEditDialog
        nomination={editingNomination}
        open={!!editingNomination}
        onOpenChange={(open) => { if (!open) setEditingNomination(null); }}
        onSave={(data) => {
          updateNomination.mutate(data, { onSuccess: () => setEditingNomination(null) });
        }}
        isSaving={updateNomination.isPending}
        nomineeName={editingNomination ? employeeMap[editingNomination.nominee_id] : undefined}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('recognition.nominations.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('recognition.nominations.confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingId) { softDelete.mutate(deletingId); setDeletingId(null); } }}
            >
              {t('recognition.nominations.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
