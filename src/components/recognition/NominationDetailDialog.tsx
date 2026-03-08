import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EndorsementForm, EndorsementListItem } from './EndorsementCard';
import { useEndorsements } from '@/hooks/recognition/useEndorsements';
import { useAuth } from '@/hooks/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Nomination } from '@/hooks/recognition/useNominations';
import { FileText, ThumbsUp, User, Calendar, Tag, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface NominationDetailDialogProps {
  nomination: Nomination | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomineeName?: string;
  nominatorName?: string;
}

export function NominationDetailDialog({
  nomination,
  open,
  onOpenChange,
  nomineeName,
  nominatorName,
}: NominationDetailDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { endorsements, isPending, submitEndorsement, validCount } = useEndorsements(nomination?.id);

  // Fetch theme name
  const { data: themeName } = useQuery({
    queryKey: ['award-theme-name', nomination?.theme_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('award_themes')
        .select('name')
        .eq('id', nomination!.theme_id)
        .is('deleted_at', null)
        .single();
      return data?.name || null;
    },
    enabled: !!nomination?.theme_id && open,
  });

  // Resolve endorser names
  const endorserIds = endorsements.map(e => e.endorser_id);
  const { data: endorserMap = {} } = useQuery({
    queryKey: ['endorser-names', endorserIds],
    queryFn: async () => {
      if (!endorserIds.length) return {};
      const { data } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .in('user_id', endorserIds)
        .is('deleted_at', null);
      const map: Record<string, string> = {};
      data?.forEach(e => { if (e.user_id) map[e.user_id] = e.full_name; });
      return map;
    },
    enabled: endorserIds.length > 0 && open,
  });

  if (!nomination) return null;

  const canEndorse =
    user?.id !== nomination.nominee_id &&
    user?.id !== nomination.nominator_id &&
    !endorsements.some(e => e.endorser_id === user?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {nomination.headline}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            {themeName && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t('recognition.nominations.theme')}:</span>
                <Badge variant="secondary">{themeName}</Badge>
              </div>
            )}
            {nomineeName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t('recognition.nominations.nominee')}:</span>
                <span className="font-medium">{nomineeName}</span>
              </div>
            )}
            {nominatorName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t('recognition.nominations.nominatedBy')}:</span>
                <span>{nominatorName}</span>
                <Badge variant="outline" className="text-xs">
                  {t(`recognition.nominations.role.${nomination.nominator_role}`, nomination.nominator_role)}
                </Badge>
              </div>
            )}
            {nomination.submitted_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(nomination.submitted_at), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          {/* Justification */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">{t('recognition.nominations.justification')}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{nomination.justification}</p>
          </div>

          {/* Examples */}
          {nomination.specific_examples && nomination.specific_examples.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium">{t('recognition.nominations.examples')}</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {nomination.specific_examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Impact */}
          {nomination.impact_metrics && nomination.impact_metrics.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium">{t('recognition.nominations.impactMetrics')}</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {nomination.impact_metrics.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Endorsements section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                {t('recognition.endorsements.title')}
              </h4>
              <Badge variant="outline">
                {validCount}/2 {t('recognition.endorsements.status.sufficient').toLowerCase()}
              </Badge>
            </div>

            {isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : endorsements.length > 0 ? (
              <div className="space-y-2">
                {endorsements.map(e => (
                  <EndorsementListItem
                    key={e.id}
                    endorsement={e}
                    endorserName={endorserMap[e.endorser_id]}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('recognition.endorsements.noEndorsements')}</p>
            )}
          </div>

          {/* Endorsement form for eligible users */}
          {canEndorse && (
            <>
              <Separator />
              <EndorsementForm
                nominationId={nomination.id}
                onSubmit={(input) => submitEndorsement.mutate(input)}
                isSubmitting={submitEndorsement.isPending}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
