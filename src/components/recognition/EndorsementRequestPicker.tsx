import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmployees } from '@/hooks/org/useEmployees';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EndorsementRequestPickerProps {
  nominationId: string;
  nomineeId: string;
  managerApprovalPending?: boolean;
  onComplete?: () => void;
}

export function EndorsementRequestPicker({ nominationId, nomineeId, managerApprovalPending, onComplete }: EndorsementRequestPickerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const { employees = [] } = useEmployees();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Filter: exclude self, nominee, and only show employees with user_id
  const eligibleColleagues = employees.filter(e =>
    e.user_id &&
    e.user_id !== user?.id &&
    e.user_id !== nomineeId
  );

  const filtered = search.trim()
    ? eligibleColleagues.filter(e =>
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.department?.toLowerCase().includes(search.toLowerCase())) ||
        (e.email?.toLowerCase().includes(search.toLowerCase()))
      )
    : eligibleColleagues;

  const toggle = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Get the current user's name for notification text
  const currentUserName = employees.find(e => e.user_id === user?.id)?.full_name || '';

  // Get nomination headline for notification body
  const getNominationHeadline = async (nomId: string) => {
    const { data } = await supabase
      .from('nominations')
      .select('headline')
      .eq('id', nomId)
      .single();
    return data?.headline || '';
  };

  const handleSend = async () => {
    if (!tenantId || !user?.id || selectedIds.size === 0) return;
    setSending(true);
    try {
      const rows = Array.from(selectedIds).map(uid => ({
        tenant_id: tenantId,
        nomination_id: nominationId,
        requested_user_id: uid,
        requested_by: user.id,
      }));
      const { error } = await supabase.from('endorsement_requests').insert(rows as any);
      if (error) throw error;

      // Create in-app notifications for each requested colleague
      const headline = await getNominationHeadline(nominationId);
      const notificationRows = Array.from(selectedIds).map(uid => ({
        tenant_id: tenantId,
        user_id: uid,
        nomination_id: nominationId,
        type: 'endorsement_requested',
        title: t('notifications.endorsementRequested', { name: currentUserName }),
        body: t('notifications.endorsementRequestedBody', { headline: headline || '—' }),
      }));
      await supabase.from('recognition_notifications').insert(notificationRows as any);

      setSent(true);
      toast.success(t('recognition.endorsements.requestsSent'));
    } catch {
      toast.error(t('recognition.endorsements.requestsError'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-10 w-10 text-chart-2 mx-auto mb-2" />
          <p className="font-medium">{t('recognition.endorsements.requestsSent')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('recognition.endorsements.requestsSentDesc', { count: selectedIds.size })}
          </p>
          {onComplete && (
            <Button variant="outline" className="mt-4" onClick={onComplete}>
              {t('common.done')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('recognition.endorsements.requestEndorsements')}
        </CardTitle>
        <CardDescription>{t('recognition.endorsements.requestEndorsementsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('recognition.endorsements.searchColleagues')}
            className="ps-9"
          />
        </div>

        {/* Selected count */}
        {selectedIds.size > 0 && (
          <Badge variant="secondary">
            {t('recognition.endorsements.selectedCount', { count: selectedIds.size })}
          </Badge>
        )}

        {/* Employee list */}
        <ScrollArea className="h-[240px] rounded-md border border-border">
          <div className="p-2 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t('recognition.endorsements.noColleaguesFound')}
              </p>
            ) : (
              filtered.map(emp => (
                <label
                  key={emp.user_id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(emp.user_id!)}
                    onCheckedChange={() => toggle(emp.user_id!)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.role_title || ''}{emp.department ? ` — ${emp.department}` : ''}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {onComplete && (
            <Button variant="ghost" size="sm" onClick={onComplete}>
              {t('recognition.endorsements.skipForNow')}
            </Button>
          )}
          <Button
            onClick={handleSend}
            disabled={selectedIds.size === 0 || sending}
            size="sm"
            className="ms-auto"
          >
            <Send className="h-3.5 w-3.5 me-1.5" />
            {t('recognition.endorsements.sendRequests')} ({selectedIds.size})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
