import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrisisCases, useIsFirstAider, useFirstAiderSchedule } from '@/hooks/useCrisisSupport';
import { useSupportSessions } from '@/hooks/crisis/useSessionScheduling';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Clock, Check, X, AlertTriangle, Shield, Star, Calendar, Timer, CircleDot } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { toast } from 'sonner';
import SessionWorkspace from '@/components/crisis/SessionWorkspace';

type AiderStatus = 'available' | 'busy' | 'offline';

export default function FirstAiderDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isFirstAider, firstAiderId } = useIsFirstAider();
  const { cases, isLoading, updateCaseStatus } = useCrisisCases({ role: 'first_aider' });
  const { schedule, upsertSchedule } = useFirstAiderSchedule(firstAiderId || undefined);
  const { sessions } = useSupportSessions(firstAiderId ? { firstAiderId } : undefined);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [aiderStatus, setAiderStatus] = useState<AiderStatus>('available');

  if (!isFirstAider) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('crisisSupport.firstAider.notAssigned')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myCases = cases.filter(c => c.assigned_first_aider_id === firstAiderId);
  const pendingCases = myCases.filter(c => c.status === 'pending_first_aider_acceptance');
  const activeCases = myCases.filter(c => ['active', 'awaiting_user', 'awaiting_first_aider'].includes(c.status));
  const resolvedCases = myCases.filter(c => ['resolved', 'closed'].includes(c.status));

  // Today's sessions
  const todaySessions = sessions.filter(s => {
    if (!s.scheduled_start) return false;
    return isToday(new Date(s.scheduled_start)) && s.status !== 'cancelled';
  });

  // Calculate stats
  const totalSessions = sessions.filter(s => s.status === 'completed').length;
  const avgResponseMin = myCases.length > 0
    ? Math.round(myCases.filter(c => c.first_response_at && c.created_at).reduce((sum, c) => {
        const diff = new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime();
        return sum + diff / 60000;
      }, 0) / Math.max(myCases.filter(c => c.first_response_at).length, 1))
    : 0;

  const selectedCase = myCases.find(c => c.id === selectedCaseId);

  if (selectedCase) {
    return (
      <SessionWorkspace
        caseId={selectedCase.id}
        tenantId={selectedCase.tenant_id}
        isFirstAider={true}
        onBack={() => setSelectedCaseId(null)}
      />
    );
  }

  const handleStatusChange = async (newStatus: AiderStatus) => {
    setAiderStatus(newStatus);
    if (!schedule || !firstAiderId) return;
    try {
      await upsertSchedule.mutateAsync({
        first_aider_id: firstAiderId,
        tenant_id: schedule.tenant_id,
        temp_unavailable: newStatus === 'offline',
      });
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const statusColors: Record<AiderStatus, string> = {
    available: 'bg-chart-2 text-chart-2',
    busy: 'bg-chart-3 text-chart-3',
    offline: 'bg-muted-foreground text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      {/* Header with 3-state status toggle */}
      <div className="glass-card border-0 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Shield className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('crisisSupport.firstAider.title')}</h1>
            <p className="text-muted-foreground">{t('crisisSupport.firstAider.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {(['available', 'busy', 'offline'] as AiderStatus[]).map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                aiderStatus === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CircleDot className={`h-3 w-3 ${statusColors[s]}`} />
              {t(`crisisSupport.firstAider.status_${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Professional Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{activeCases.length}</p>
            <p className="text-xs text-muted-foreground">{t('crisisSupport.firstAider.activeCases')}</p>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center mb-2">
              <Check className="h-5 w-5 text-chart-2" />
            </div>
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">{t('crisisSupport.firstAider.totalSessions')}</p>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center mb-2">
              <Timer className="h-5 w-5 text-chart-3" />
            </div>
            <p className="text-2xl font-bold">{avgResponseMin}<span className="text-sm font-normal text-muted-foreground">m</span></p>
            <p className="text-xs text-muted-foreground">{t('crisisSupport.firstAider.avgResponse')}</p>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-chart-4" />
            </div>
            <p className="text-2xl font-bold">{todaySessions.length}</p>
            <p className="text-xs text-muted-foreground">{t('crisisSupport.firstAider.todaySessions')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      {todaySessions.length > 0 && (
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {t('crisisSupport.firstAider.todaySchedule')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {session.scheduled_start ? format(new Date(session.scheduled_start), 'h:mm a') : '—'}
                      {session.scheduled_end ? ` – ${format(new Date(session.scheduled_end), 'h:mm a')}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{session.channel} · {session.status}</p>
                  </div>
                </div>
                {session.status === 'scheduled' && (
                  <Button size="sm" className="rounded-xl">{t('crisisSupport.firstAider.joinSession')}</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Case Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-tabs">
          <TabsTrigger value="pending" className="rounded-xl">
            {t('crisisSupport.firstAider.pending')}
            {pendingCases.length > 0 && <Badge variant="destructive" className="ms-1.5 text-xs">{pendingCases.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl">
            {t('crisisSupport.firstAider.active')}
            {activeCases.length > 0 && <Badge variant="secondary" className="ms-1.5 text-xs">{activeCases.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-xl">{t('crisisSupport.firstAider.resolved')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <CaseList
            cases={pendingCases}
            isLoading={isLoading}
            onSelect={setSelectedCaseId}
            actions={(c) => (
              <div className="flex gap-1">
                <Button size="sm" onClick={(e) => { e.stopPropagation(); updateCaseStatus.mutateAsync({ id: c.id, status: 'active' }); }}>
                  <Check className="h-3 w-3 me-1" />{t('crisisSupport.firstAider.accept')}
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateCaseStatus.mutateAsync({ id: c.id, status: 'pending_assignment', assigned_first_aider_id: null }); }}>
                  <X className="h-3 w-3 me-1" />{t('crisisSupport.firstAider.decline')}
                </Button>
              </div>
            )}
          />
        </TabsContent>
        <TabsContent value="active">
          <CaseList cases={activeCases} isLoading={isLoading} onSelect={setSelectedCaseId} />
        </TabsContent>
        <TabsContent value="resolved">
          <CaseList cases={resolvedCases} isLoading={isLoading} onSelect={setSelectedCaseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Case List ─────────────────────────────────────────────────────
function CaseList({ cases, isLoading, onSelect, actions }: { cases: any[]; isLoading: boolean; onSelect: (id: string) => void; actions?: (c: any) => React.ReactNode }) {
  const { t } = useTranslation();

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">{t('common.loading')}</p>;
  if (cases.length === 0) return <p className="text-muted-foreground py-8 text-center">{t('common.noData')}</p>;

  const riskIndicator = (risk: string) => {
    if (risk === 'high') return 'border-s-4 border-s-destructive';
    if (risk === 'moderate') return 'border-s-4 border-s-chart-3';
    return 'border-s-4 border-s-chart-2';
  };

  return (
    <div className="space-y-3 mt-4">
      {cases.map(c => (
        <Card key={c.id} className={`glass-card border-0 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${riskIndicator(c.risk_level)}`} onClick={() => onSelect(c.id)}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t(`crisisSupport.intents.${c.intent}`)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={c.risk_level === 'high' ? 'destructive' : c.risk_level === 'moderate' ? 'secondary' : 'outline'} className="text-[10px]">
                      {c.risk_level}
                    </Badge>
                    {c.urgency_level && (
                      <Badge variant="outline" className="text-[10px]">U{c.urgency_level}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                    {c.anonymity_mode === 'anonymous' && <Badge variant="outline" className="text-[10px]">{t('crisisSupport.request.anonymous')}</Badge>}
                  </div>
                </div>
              </div>
              {actions ? actions(c) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
