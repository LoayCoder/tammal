import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrisisMessages } from '@/hooks/crisis/useCrisisSupport';
import { useSessionScheduling, useSupportSessions } from '@/hooks/crisis/useSessionScheduling';
import { useAuth } from '@/hooks/auth/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  MessageSquare, Send, Clock, ArrowLeft, AlertTriangle, FileText,
  Phone, Video, CheckCircle, XCircle, RotateCw
} from 'lucide-react';

interface Props {
  caseId: string;
  sessionId?: string;
  tenantId: string;
  isFirstAider: boolean;
  onBack: () => void;
}

export default function SessionWorkspace({ caseId, sessionId, tenantId, isFirstAider, onBack }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, sendMessage } = useCrisisMessages(caseId);
  const { endSession } = useSessionScheduling();
  const { sessions } = useSupportSessions(sessionId ? { firstAiderId: undefined, requesterUserId: undefined } : undefined);

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [outcome, setOutcome] = useState('resolved');

  const currentSession = sessions.find(s => s.id === sessionId);
  const isActive = currentSession?.status === 'active' || currentSession?.status === 'scheduled';

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage.mutateAsync({ case_id: caseId, tenant_id: tenantId, message: newMessage.trim() });
      setNewMessage('');
    } catch { /* handled */ } finally { setSending(false); }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      await endSession.mutateAsync({ sessionId, outcome, notes: sessionNotes || undefined });
      toast.success(t('crisisSupport.session.ended'));
      setShowOutcomeForm(false);
    } catch {
      toast.error(t('common.error'));
    }
  };

  // Calculate session duration if active
  const sessionDuration = currentSession?.actual_start
    ? Math.round((Date.now() - new Date(currentSession.actual_start).getTime()) / 60000)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Chat Panel (2/3 width on desktop) */}
      <div className="lg:col-span-2 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{t('crisisSupport.session.workspace')}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {currentSession?.channel && (
                <Badge variant="outline" className="text-[10px]">
                  {currentSession.channel === 'voice' ? <Phone className="h-3 w-3 me-1" /> :
                   currentSession.channel === 'video' ? <Video className="h-3 w-3 me-1" /> :
                   <MessageSquare className="h-3 w-3 me-1" />}
                  {currentSession.channel}
                </Badge>
              )}
              {sessionDuration !== null && (
                <Badge variant="secondary" className="text-[10px]">
                  <Clock className="h-3 w-3 me-1" />
                  {sessionDuration} min
                </Badge>
              )}
            </div>
          </div>
          {isFirstAider && isActive && (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setShowOutcomeForm(true)}>
                <CheckCircle className="h-3 w-3 me-1" />
                {t('crisisSupport.session.endSession')}
              </Button>
            </div>
          )}
        </div>

        {/* Messages */}
        <Card className="glass-card border-0 rounded-xl flex-1 flex flex-col min-h-[300px]">
          <CardContent className="flex-1 pt-4 space-y-3 max-h-[500px] overflow-y-auto">
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

          {/* Message input */}
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
        </Card>
      </div>

      {/* Tools Panel (1/3 width on desktop) */}
      <div className="space-y-4">
        {/* Quick Escalation */}
        {isFirstAider && (
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {t('crisisSupport.session.escalation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="destructive" size="sm" className="w-full text-xs">
                {t('crisisSupport.session.escalateEmergency')}
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <RotateCw className="h-3 w-3 me-1" />
                {t('crisisSupport.session.rerouteCase')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Session Notes (First Aider Only) */}
        {isFirstAider && (
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('crisisSupport.session.notes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder={t('crisisSupport.session.notesPlaceholder')}
                className="min-h-[120px] text-sm"
              />
            </CardContent>
          </Card>
        )}

        {/* End Session Form */}
        {showOutcomeForm && (
          <Card className="border-destructive/30 bg-destructive/5 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('crisisSupport.session.outcomeTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">{t('crisisSupport.session.outcomeResolved')}</SelectItem>
                  <SelectItem value="escalated">{t('crisisSupport.session.outcomeEscalated')}</SelectItem>
                  <SelectItem value="follow_up">{t('crisisSupport.session.outcomeFollowUp')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowOutcomeForm(false)} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button size="sm" onClick={handleEndSession} className="flex-1">
                  {t('common.confirm')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Info */}
        {currentSession && (
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('crisisSupport.session.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {currentSession.scheduled_start && (
                <p>📅 {format(new Date(currentSession.scheduled_start), 'MMM d, yyyy h:mm a')}</p>
              )}
              <p>📡 {currentSession.channel}</p>
              <Badge variant={currentSession.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                {currentSession.status}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
