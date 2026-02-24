import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCrisisCases, useCrisisMessages, useIsFirstAider, useFirstAiderSchedule } from '@/hooks/useCrisisSupport';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Clock, Send, ArrowLeft, Check, X, AlertTriangle, Activity, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function FirstAiderDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isFirstAider, firstAiderId } = useIsFirstAider();
  const { cases, isLoading, updateCaseStatus } = useCrisisCases({ role: 'first_aider' });
  const { schedule, upsertSchedule } = useFirstAiderSchedule(firstAiderId || undefined);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

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

  const selectedCase = myCases.find(c => c.id === selectedCaseId);

  if (selectedCase) {
    return <FirstAiderCaseThread caseData={selectedCase} onBack={() => setSelectedCaseId(null)} />;
  }

  const handleToggleUnavailable = async () => {
    if (!schedule || !firstAiderId) return;
    try {
      await upsertSchedule.mutateAsync({
        first_aider_id: firstAiderId,
        tenant_id: schedule.tenant_id,
        temp_unavailable: !schedule.temp_unavailable,
      });
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Shield className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('crisisSupport.firstAider.title')}</h1>
            <p className="text-muted-foreground">{t('crisisSupport.firstAider.subtitle')}</p>
          </div>
        </div>
        {schedule && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t('crisisSupport.firstAider.tempUnavailable')}</Label>
            <Switch checked={schedule.temp_unavailable} onCheckedChange={handleToggleUnavailable} />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{activeCases.length}</p>
            <p className="text-sm text-muted-foreground">{t('crisisSupport.firstAider.activeCases')}</p>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{pendingCases.length}</p>
            <p className="text-sm text-muted-foreground">{t('crisisSupport.firstAider.pendingRequests')}</p>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{resolvedCases.length}</p>
            <p className="text-sm text-muted-foreground">{t('crisisSupport.firstAider.resolvedCases')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-tabs">
          <TabsTrigger value="pending" className="rounded-xl">
            {t('crisisSupport.firstAider.pending')}
            {pendingCases.length > 0 && <Badge variant="destructive" className="ms-1.5 text-xs">{pendingCases.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl">{t('crisisSupport.firstAider.active')}</TabsTrigger>
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

function CaseList({ cases, isLoading, onSelect, actions }: { cases: any[]; isLoading: boolean; onSelect: (id: string) => void; actions?: (c: any) => React.ReactNode }) {
  const { t } = useTranslation();

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">{t('common.loading')}</p>;
  if (cases.length === 0) return <p className="text-muted-foreground py-8 text-center">{t('common.noData')}</p>;

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
                    <Badge variant={c.risk_level === 'high' ? 'destructive' : c.risk_level === 'moderate' ? 'secondary' : 'outline'} className="text-[10px]">
                      {c.risk_level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                    {c.anonymity_mode === 'anonymous' && <Badge variant="outline" className="text-[10px]">Anonymous</Badge>}
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

function FirstAiderCaseThread({ caseData, onBack }: { caseData: any; onBack: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useCrisisMessages(caseData.id);
  const { updateCaseStatus } = useCrisisCases();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage.mutateAsync({
        case_id: caseData.id,
        tenant_id: caseData.tenant_id,
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch { /* handled */ } finally { setSending(false); }
  };

  const isActive = ['active', 'awaiting_user', 'awaiting_first_aider'].includes(caseData.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">{t(`crisisSupport.intents.${caseData.intent}`)}</h2>
          <p className="text-xs text-muted-foreground">{caseData.anonymity_mode === 'anonymous' ? 'Anonymous' : ''} · {format(new Date(caseData.created_at), 'MMM d, yyyy')}</p>
        </div>
        {isActive && (
          <Button size="sm" variant="outline" onClick={() => updateCaseStatus.mutateAsync({ id: caseData.id, status: 'resolved' })}>
            <Check className="h-3 w-3 me-1" />{t('crisisSupport.firstAider.resolve')}
          </Button>
        )}
      </div>

      {caseData.summary && (
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{caseData.summary}</p>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card border-0 rounded-xl min-h-[300px] flex flex-col">
        <CardContent className="flex-1 pt-4 space-y-3 max-h-[400px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">{t('crisisSupport.mySupport.noMessages')}</p>
          ) : messages.map(msg => {
            const isMe = msg.sender_user_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
        {isActive && (
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={t('crisisSupport.mySupport.messagePlaceholder')}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
