import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCrisisCases, useCrisisMessages } from '@/hooks/useCrisisSupport';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Clock, Send, ArrowLeft, X } from 'lucide-react';
import { format } from 'date-fns';

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
  const { user } = useAuth();
  const { cases, isLoading, updateCaseStatus } = useCrisisCases({ role: 'requester' });
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const myCases = cases.filter(c => c.requester_user_id === user?.id);
  const selectedCase = myCases.find(c => c.id === selectedCaseId);

  if (selectedCase) {
    return <CaseThread caseData={selectedCase} onBack={() => setSelectedCaseId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('crisisSupport.mySupport.title')}</h1>
        <p className="text-muted-foreground">{t('crisisSupport.mySupport.subtitle')}</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : myCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('crisisSupport.mySupport.noCases')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myCases.map(c => (
            <Card key={c.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedCaseId(c.id)}>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Case Thread ─────────────────────────────────────────────────────
function CaseThread({ caseData, onBack }: { caseData: any; onBack: () => void }) {
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
    } catch {
      // Error handled by mutation
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    await updateCaseStatus.mutateAsync({ id: caseData.id, status: 'cancelled' });
    onBack();
  };

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

      {/* Messages */}
      <Card className="min-h-[300px] flex flex-col">
        <CardContent className="flex-1 pt-4 space-y-3 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">{t('common.loading')}</p>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">{t('crisisSupport.mySupport.noMessages')}</p>
          ) : (
            messages.map(msg => {
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
            })
          )}
        </CardContent>

        {/* Input */}
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

      {/* Actions */}
      {caseData.status !== 'cancelled' && caseData.status !== 'closed' && caseData.status !== 'resolved' && (
        <Button variant="outline" onClick={handleCancel} className="gap-1.5">
          <X className="h-4 w-4" />
          {t('crisisSupport.mySupport.cancelRequest')}
        </Button>
      )}
    </div>
  );
}
