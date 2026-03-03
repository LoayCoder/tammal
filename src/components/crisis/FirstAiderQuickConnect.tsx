import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirstAiders, useCrisisCases } from '@/hooks/crisis/useCrisisSupport';
import { useAuth } from '@/hooks/auth/useAuth';
import EmployeeBookingWidget from '@/components/crisis/EmployeeBookingWidget';
import { Phone, MessageSquare, CalendarDays, Star, Languages, Loader2, HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-chart-1/20 text-chart-1',
  busy: 'bg-chart-4/20 text-chart-4',
  offline: 'bg-muted text-muted-foreground',
};

export default function FirstAiderQuickConnect({ open, onOpenChange, tenantId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { firstAiders, isPending } = useFirstAiders(tenantId);
  const { createCase } = useCrisisCases();
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const activeAiders = firstAiders.filter(fa => fa.is_active);

  const handleAction = async (firstAiderId: string, method: 'voice' | 'chat', displayName: string) => {
    if (!tenantId || !user?.id) return;
    const actionKey = `${firstAiderId}-${method}`;
    setLoadingAction(actionKey);
    try {
      await createCase.mutateAsync({
        tenant_id: tenantId,
        intent: 'talk_to_someone',
        anonymity_mode: 'identified',
        summary: method === 'voice' ? 'Urgent call request' : 'Chat request',
        urgency_level: method === 'voice' ? 5 : 3,
        preferred_contact_method: method,
      });
      toast.success(
        method === 'voice'
          ? t('crisisSupport.urgentCallCreated', 'Urgent call request sent!')
          : t('crisisSupport.chatCreated', 'Chat request sent!')
      );
      onOpenChange(false);
      navigate('/my-support');
    } catch {
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-chart-1" />
            {t('crisisSupport.connectFirstAider', 'Connect with a First Aider')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : activeAiders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('crisisSupport.noFirstAiders', 'No First Aiders available at the moment.')}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {activeAiders.map(aider => {
                const statusLabel = aider.statusLabel || 'offline';
                const statusClass = STATUS_COLORS[statusLabel] || STATUS_COLORS.offline;
                const isBooking = activeBookingId === aider.id;
                const langs = aider.languages || [];

                return (
                  <Card key={aider.id} className="glass-card border-0 ring-1 ring-border/40">
                    <CardContent className="p-4 space-y-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                            {aider.display_name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate">{aider.display_name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {langs.length > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <Languages className="h-3 w-3" />
                                  {langs.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`shrink-0 text-xs ${statusClass}`}>
                          {t(`crisisSupport.status.${statusLabel}`, statusLabel)}
                        </Badge>
                      </div>

                      {/* Bio */}
                      {aider.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{aider.bio}</p>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          disabled={!!loadingAction}
                          onClick={() => handleAction(aider.id, 'voice', aider.display_name)}
                        >
                          {loadingAction === `${aider.id}-voice` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Phone className="h-3.5 w-3.5" />
                          )}
                          {t('crisisSupport.urgentCall', 'Urgent')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          disabled={!!loadingAction}
                          onClick={() => handleAction(aider.id, 'chat', aider.display_name)}
                        >
                          {loadingAction === `${aider.id}-chat` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5" />
                          )}
                          {t('crisisSupport.chat', 'Chat')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setActiveBookingId(isBooking ? null : aider.id)}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {t('crisisSupport.bookSession', 'Book Session')}
                        </Button>
                      </div>

                      {/* Inline booking widget */}
                      {isBooking && tenantId && (
                        <div className="pt-2 border-t border-border/40">
                          <EmployeeBookingWidget
                            firstAiderId={aider.id}
                            tenantId={tenantId}
                            displayName={aider.display_name}
                            communicationChannel="chat"
                            onBooked={() => {
                              setActiveBookingId(null);
                              onOpenChange(false);
                              toast.success(t('crisisSupport.sessionBooked', 'Session booked!'));
                              navigate('/my-support');
                            }}
                            onCancel={() => setActiveBookingId(null)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
