import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrisisCases } from '@/hooks/crisis/useCrisisSupport';
import { useAuth } from '@/hooks/auth/useAuth';
import { MessageSquare, Clock, ArrowLeft, X, Plus, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import EnhancedChatPanel from '@/components/crisis/EnhancedChatPanel';

const STATUS_COLORS: Record<string, string> = {
  new: 'secondary',
  pending_assignment: 'secondary',
  pending_first_aider_acceptance: 'secondary',
  active: 'default',
  awaiting_user: 'default',
  awaiting_first_aider: 'default',
  escalated: 'destructive',
  resolved: 'outline',
  closed: 'outline',
  cancelled: 'outline',
};

export default function MySupportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases, isPending, updateCaseStatus } = useCrisisCases({ role: 'requester' });
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const myCases = cases.filter(c => c.requester_user_id === user?.id);
  const activeCases = myCases.filter(c => !['resolved', 'closed', 'cancelled'].includes(c.status));
  const pastCases = myCases.filter(c => ['resolved', 'closed', 'cancelled'].includes(c.status));
  const selectedCase = myCases.find(c => c.id === selectedCaseId);

  if (selectedCase) {
    return <CaseThread caseData={selectedCase} onBack={() => setSelectedCaseId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><MessageSquare className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('crisisSupport.mySupport.title')}</h1>
            <p className="text-muted-foreground">{t('crisisSupport.mySupport.subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => navigate('/crisis-support')} className="gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" />
          {t('crisisSupport.mySupport.newRequest')}
        </Button>
      </div>

      {isPending ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : myCases.length === 0 ? (
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('crisisSupport.mySupport.noCases')}</p>
            <Button onClick={() => navigate('/crisis-support')} className="mt-4">{t('crisisSupport.mySupport.newRequest')}</Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass-tabs">
            <TabsTrigger value="active" className="rounded-xl">
              {t('crisisSupport.mySupport.activeCases')}
              {activeCases.length > 0 && <Badge variant="secondary" className="ms-1.5 text-xs">{activeCases.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl">
              {t('crisisSupport.mySupport.history')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <CaseCardList cases={activeCases} onSelect={setSelectedCaseId} />
          </TabsContent>
          <TabsContent value="history">
            <CaseCardList cases={pastCases} onSelect={setSelectedCaseId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function CaseCardList({ cases, onSelect }: { cases: any[]; onSelect: (id: string) => void }) {
  const { t } = useTranslation();

  if (cases.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">{t('common.noData')}</p>;
  }

  return (
    <div className="space-y-3 mt-4">
      {cases.map(c => (
        <Card key={c.id} className="glass-card border-0 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" onClick={() => onSelect(c.id)}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t(`crisisSupport.intents.${c.intent}`)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </div>
              <Badge variant={STATUS_COLORS[c.status] as any || 'secondary'} className="text-xs">
                {t(`crisisSupport.statuses.${c.status}`)}
              </Badge>
            </div>
            {/* Session notes shared by first aider (read-only) */}
            {c.status === 'resolved' && c.summary && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{t('crisisSupport.mySupport.sharedNotes')}</span>
                </div>
                <p className="text-xs text-foreground">{c.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Case Thread (Enhanced with EnhancedChatPanel) ───────────────────
function CaseThread({ caseData, onBack }: { caseData: any; onBack: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { updateCaseStatus } = useCrisisCases();

  const isActive = ['active', 'awaiting_user', 'awaiting_first_aider', 'pending_first_aider_acceptance'].includes(caseData.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">{t(`crisisSupport.intents.${caseData.intent}`)}</h2>
          <p className="text-xs text-muted-foreground">{format(new Date(caseData.created_at), 'MMM d, yyyy h:mm a')}</p>
        </div>
        <Badge variant={STATUS_COLORS[caseData.status] as any || 'secondary'}>
          {t(`crisisSupport.statuses.${caseData.status}`)}
        </Badge>
      </div>

      {/* Enhanced chat */}
      <Card className="glass-card border-0 rounded-xl overflow-hidden">
        <EnhancedChatPanel
          caseId={caseData.id}
          tenantId={caseData.tenant_id}
        />
      </Card>

      {/* Actions */}
      {caseData.status !== 'cancelled' && caseData.status !== 'closed' && caseData.status !== 'resolved' && (
        <Button
          variant="outline"
          onClick={() => { updateCaseStatus.mutateAsync({ id: caseData.id, status: 'cancelled' }); onBack(); }}
          className="gap-1.5"
        >
          <X className="h-4 w-4" />
          {t('crisisSupport.mySupport.cancelRequest')}
        </Button>
      )}

      {/* Follow-up from resolved */}
      {caseData.status === 'resolved' && (
        <Button
          variant="outline"
          onClick={() => { /* navigate to new request with context */ }}
          className="gap-1.5"
        >
          <Calendar className="h-4 w-4" />
          {t('crisisSupport.mySupport.scheduleFollowup')}
        </Button>
      )}
    </div>
  );
}
