import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, ThumbsUp, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Nomination } from '@/hooks/recognition/useNominations';

interface NominationCardProps {
  nomination: Nomination;
  nomineeName?: string;
  nominatorName?: string;
  onDelete?: () => void;
  showActions?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-primary/10 text-primary',
  endorsed: 'bg-chart-2/10 text-chart-2',
  shortlisted: 'bg-chart-4/10 text-chart-4',
  rejected: 'bg-destructive/10 text-destructive',
};

const endorsementColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  sufficient: 'bg-chart-2/10 text-chart-2',
  insufficient: 'bg-destructive/10 text-destructive',
};

export function NominationCard({
  nomination,
  nomineeName,
  nominatorName,
  onDelete,
  showActions = false,
}: NominationCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-1">{nomination.headline}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={statusColors[nomination.status] || ''}>
              {t(`recognition.nominations.status.${nomination.status}`, nomination.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <p className="text-sm text-muted-foreground line-clamp-3">{nomination.justification}</p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <Badge className={endorsementColors[nomination.endorsement_status] || ''} variant="outline">
              <ThumbsUp className="h-3 w-3 me-1" />
              {t(`recognition.endorsements.status.${nomination.endorsement_status}`, nomination.endorsement_status)}
            </Badge>
            {nomination.submitted_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(nomination.submitted_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          {showActions && onDelete && nomination.status === 'draft' && (
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
