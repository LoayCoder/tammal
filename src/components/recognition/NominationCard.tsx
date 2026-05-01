import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, ThumbsUp, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import type { Nomination } from '@/hooks/recognition/useNominations';

interface NominationCardProps {
  nomination: Nomination;
  nomineeName?: string;
  nominatorName?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

const canModify = (n: Nomination) =>
  ['draft', 'submitted'].includes(n.status) &&
  ['not_required', 'pending'].includes(n.manager_approval_status);

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

const managerApprovalColors: Record<string, string> = {
  not_required: '',
  pending: 'bg-chart-4/10 text-chart-4',
  approved: 'bg-chart-2/10 text-chart-2',
  rejected: 'bg-destructive/10 text-destructive',
};

export function NominationCard({
  nomination,
  nomineeName,
  nominatorName,
  onDelete,
  onEdit,
  showActions = false,
}: NominationCardProps) {
  const { t } = useTranslation();

  const displayedEndorsementStatus =
    ['endorsed', 'shortlisted'].includes(nomination.status)
      ? 'sufficient'
      : nomination.endorsement_status;

  return (
    <Card className="rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-sm)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
                {nomination.status === 'submitted' ? 'In review' : nomination.status}
              </Badge>
              {nomination.manager_approval_status && nomination.manager_approval_status !== 'not_required' && (
                <Badge className={managerApprovalColors[nomination.manager_approval_status] || ''} variant="outline">
                  {t(`recognition.nominations.managerApprovalStatus.${nomination.manager_approval_status}`, nomination.manager_approval_status)}
                </Badge>
              )}
            </div>
            <CardTitle className="text-base line-clamp-1 text-[var(--text-primary)]">{nomination.headline}</CardTitle>
          </div>
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

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Approval state</p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {t(`recognition.nominations.managerApprovalStatus.${nomination.manager_approval_status}`, nomination.manager_approval_status)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Peer proof</p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {t(`recognition.endorsements.status.${displayedEndorsementStatus}`, displayedEndorsementStatus)}
            </p>
          </div>
        </div>

        {nomination.manager_approval_status === 'rejected' && nomination.manager_rejection_reason && (
          <p className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] p-3 text-xs text-destructive">{nomination.manager_rejection_reason}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <Badge className={endorsementColors[displayedEndorsementStatus] || ''} variant="outline">
              <ThumbsUp className="h-3 w-3 me-1" />
              {t(`recognition.endorsements.status.${displayedEndorsementStatus}`, displayedEndorsementStatus)}
            </Badge>
            {nomination.submitted_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(nomination.submitted_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          {showActions && canModify(nomination) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
