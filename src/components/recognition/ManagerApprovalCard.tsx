import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Nomination } from '@/hooks/recognition/useNominations';

interface ManagerApprovalCardProps {
  nomination: Nomination;
  nomineeName?: string;
  nominatorName?: string;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function ManagerApprovalCard({
  nomination,
  nomineeName,
  nominatorName,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ManagerApprovalCardProps) {
  const { t } = useTranslation();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-1">{nomination.headline}</CardTitle>
            <Badge className="bg-chart-4/10 text-chart-4 shrink-0">
              {t('recognition.nominations.pendingManagerApproval')}
            </Badge>
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

          {nomination.submitted_at && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(nomination.submitted_at), 'MMM d, yyyy')}
            </span>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(nomination.id)}
              disabled={isApproving || isRejecting}
            >
              <CheckCircle className="h-4 w-4 me-1" />
              {t('recognition.nominations.approveNomination')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={isApproving || isRejecting}
            >
              <XCircle className="h-4 w-4 me-1" />
              {t('recognition.nominations.rejectNomination')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('recognition.nominations.rejectNomination')}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={t('recognition.nominations.rejectionReason')}
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || isRejecting}
              onClick={() => {
                onReject(nomination.id, rejectionReason.trim());
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              {t('recognition.nominations.rejectNomination')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
