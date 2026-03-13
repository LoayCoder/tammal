import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { CriteriaEvaluationForm, isCriteriaWeightValid, type CriterionEvaluation } from './CriteriaEvaluationForm';
import { User, Calendar, CheckCircle, XCircle, Scale, Users, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useEmployees } from '@/hooks/org/useEmployees';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
import { useExistingEndorsers } from '../hooks/useRecognitionQueries';
import type { Nomination } from '@/features/recognition/hooks/recognition/useNominations';

interface ManagerApprovalCardProps {
  nomination: Nomination;
  nomineeName?: string;
  nominatorName?: string;
  criteriaEvaluations?: CriterionEvaluation[];
  onApprove: (id: string, criteriaAdjustments?: Record<string, { weight: number; justification: string }>, additionalEndorserIds?: string[]) => void;
  onReject: (id: string, reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function ManagerApprovalCard({
  nomination,
  nomineeName,
  nominatorName,
  criteriaEvaluations: initialCriteria,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ManagerApprovalCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCriteria, setShowCriteria] = useState(false);
  const [adjustedCriteria, setAdjustedCriteria] = useState<CriterionEvaluation[]>([]);
  const [endorsersOpen, setEndorsersOpen] = useState(false);
  const [selectedEndorserIds, setSelectedEndorserIds] = useState<Set<string>>(new Set());
  const [endorserSearch, setEndorserSearch] = useState('');

  const { employees = [] } = useEmployees();

  // Fetch already-requested endorser user_ids for this nomination
  const { data: existingEndorserIds = [] } = useExistingEndorsers(nomination.id);

  // Filter: exclude nominee, nominator, self, and already-requested
  const excludeIds = new Set([
    nomination.nominee_id,
    nomination.nominator_id,
    user?.id || '',
    ...existingEndorserIds,
  ]);

  const eligibleColleagues = employees.filter(e =>
    e.user_id && !excludeIds.has(e.user_id)
  );

  const filteredColleagues = endorserSearch.trim()
    ? eligibleColleagues.filter(e =>
        e.full_name.toLowerCase().includes(endorserSearch.toLowerCase()) ||
        (e.department?.toLowerCase().includes(endorserSearch.toLowerCase())) ||
        (e.email?.toLowerCase().includes(endorserSearch.toLowerCase()))
      )
    : eligibleColleagues;

  const toggleEndorser = (userId: string) => {
    setSelectedEndorserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  useEffect(() => {
    if (initialCriteria && initialCriteria.length > 0) {
      setAdjustedCriteria(initialCriteria);
    }
  }, [initialCriteria]);

  const hasCriteria = adjustedCriteria.length > 0;
  const criteriaValid = !hasCriteria || isCriteriaWeightValid(adjustedCriteria);

  const handleApprove = () => {
    const adj = hasCriteria
      ? Object.fromEntries(adjustedCriteria.map(c => [c.criterion_id, { weight: c.weight, justification: c.justification }]))
      : undefined;
    const endorserIds = selectedEndorserIds.size > 0 ? Array.from(selectedEndorserIds) : undefined;
    onApprove(nomination.id, adj, endorserIds);
  };

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

          {/* Criteria evaluation section */}
          {hasCriteria && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowCriteria(!showCriteria)}
            >
              <Scale className="h-4 w-4 me-1" />
              {showCriteria
                ? t('recognition.criteriaEval.hideCriteria')
                : t('recognition.criteriaEval.viewAdjustCriteria')}
            </Button>
          )}

          {showCriteria && hasCriteria && (
            <div className="pt-2">
              <CriteriaEvaluationForm
                criteria={adjustedCriteria}
                onChange={setAdjustedCriteria}
              />
            </div>
          )}

          {/* Additional endorsers section */}
          <Collapsible open={endorsersOpen} onOpenChange={setEndorsersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Users className="h-4 w-4 me-1" />
                {t('recognition.nominations.addAdditionalEndorsers')}
                {selectedEndorserIds.size > 0 && (
                  <Badge variant="secondary" className="ms-2 text-xs">{selectedEndorserIds.size}</Badge>
                )}
                <ChevronDown className={`h-3.5 w-3.5 ms-auto transition-transform ${endorsersOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={endorserSearch}
                  onChange={e => setEndorserSearch(e.target.value)}
                  placeholder={t('recognition.endorsements.searchColleagues')}
                  className="ps-9"
                />
              </div>
              {selectedEndorserIds.size > 0 && (
                <Badge variant="secondary">
                  {t('recognition.endorsements.selectedCount', { count: selectedEndorserIds.size })}
                </Badge>
              )}
              <ScrollArea className="h-[180px] rounded-md border border-border">
                <div className="p-2 space-y-1">
                  {filteredColleagues.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {t('recognition.endorsements.noColleaguesFound')}
                    </p>
                  ) : (
                    filteredColleagues.map(emp => (
                      <label
                        key={emp.user_id}
                        className="flex items-center gap-3 rounded-md p-2 hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedEndorserIds.has(emp.user_id!)}
                          onCheckedChange={() => toggleEndorser(emp.user_id!)}
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
            </CollapsibleContent>
          </Collapsible>

          {nomination.submitted_at && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(nomination.submitted_at), 'MMM d, yyyy')}
            </span>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isApproving || isRejecting || !criteriaValid}
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



