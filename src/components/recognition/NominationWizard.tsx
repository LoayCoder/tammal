import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QuotaIndicator } from './QuotaIndicator';
import { EndorsementRequestPicker } from './EndorsementRequestPicker';
import { NominationCriteriaForm } from './NominationCriteriaForm';
import { CriteriaWeightTable } from './CriteriaWeightTable';
import { useNominations, useManagerQuota, usePeerQuota, type CreateNominationInput } from '@/hooks/recognition/useNominations';
import { useEmployees } from '@/hooks/org/useEmployees';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { supabase } from '@/integrations/supabase/client';
import type { CriterionEvaluation } from './CriteriaEvaluationForm';
import { User, FileText, Scale, ThumbsUp, CheckCircle, ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NominationWizardProps {
  cycleId: string;
  themeId: string;
  preselectedNomineeId?: string;
  onBack?: () => void;
  onComplete?: () => void;
}

type Step = 'select_nominee' | 'justification' | 'criteria_evaluation' | 'review' | 'request_endorsements';
const STEPS: Step[] = ['select_nominee', 'justification', 'criteria_evaluation', 'review', 'request_endorsements'];
const VISIBLE_STEPS: Step[] = ['select_nominee', 'justification', 'criteria_evaluation', 'review'];

export function NominationWizard({ cycleId, themeId, preselectedNomineeId, onComplete }: NominationWizardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const { createNomination } = useNominations();
  const { data: managerQuota } = useManagerQuota(themeId);
  const { data: peerQuota } = usePeerQuota(themeId);
  const { employees = [] } = useEmployees();

  // Fetch existing nominations by current user in this cycle to prevent duplicates
  const { data: existingNominations } = useQuery({
    queryKey: ['user-cycle-nominations', cycleId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nominations')
        .select('nominee_id')
        .eq('cycle_id', cycleId)
        .eq('nominator_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return data;
    },
    enabled: !!cycleId && !!user?.id,
  });

  const alreadyNominatedIds = new Set(existingNominations?.map(n => n.nominee_id) ?? []);

  // Fetch cycle fairness_config to determine allowAppeals
  const { data: cycleConfig } = useQuery({
    queryKey: ['cycle-config', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('award_cycles')
        .select('fairness_config')
        .eq('id', cycleId)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!cycleId,
  });

  const [step, setStep] = useState<Step>('select_nominee');
  const [nomineeId, setNomineeId] = useState(preselectedNomineeId || '');
  const [nominatorRole, setNominatorRole] = useState<'manager' | 'peer' | 'self'>('peer');
  const [headline, setHeadline] = useState('');
  const [justification, setJustification] = useState('');
  const [examples, setExamples] = useState('');
  const [impact, setImpact] = useState('');
  const [criteriaEvaluations, setCriteriaEvaluations] = useState<CriterionEvaluation[]>([]);
  const [createdNominationId, setCreatedNominationId] = useState<string | null>(null);
  const [managerApprovalPending, setManagerApprovalPending] = useState(false);

  // Progress bar only shows the 4 visible steps
  const visibleStepIdx = VISIBLE_STEPS.indexOf(step as any);
  const currentStepIdx = STEPS.indexOf(step);
  const progressPercent = step === 'request_endorsements'
    ? 100
    : ((visibleStepIdx + 1) / VISIBLE_STEPS.length) * 100;
  const justificationLength = justification.trim().length;
  const isJustificationValid = justificationLength >= 200 && justificationLength <= 10000;

  const selectedEmployee = employees.find(e => e.user_id === nomineeId);

  const eligibleEmployees = (nominatorRole === 'self'
    ? employees.filter(e => e.user_id === user?.id)
    : employees.filter(e => e.user_id !== user?.id)
  ).filter(e => !e.user_id || !alreadyNominatedIds.has(e.user_id));

  const isPreselectedAlreadyNominated = !!preselectedNomineeId && alreadyNominatedIds.has(preselectedNomineeId);

  // Extract allowAppeals from cycle fairness_config
  const allowAppeals = (() => {
    const fc = cycleConfig?.fairness_config as any;
    return fc?.auditSettings?.allowAppeals === true;
  })();

  const goNext = () => {
    const idx = currentStepIdx + 1;
    if (idx < STEPS.length) setStep(STEPS[idx]);
  };

  const goPrev = () => {
    const idx = currentStepIdx - 1;
    if (idx >= 0) setStep(STEPS[idx]);
  };

  const handleCriteriaSubmit = (evals: CriterionEvaluation[]) => {
    setCriteriaEvaluations(evals);
    goNext();
  };

  const handleSubmit = async () => {
    try {
      const nominee = employees.find(e => e.user_id === nomineeId);
      const input: CreateNominationInput = {
        cycle_id: cycleId,
        theme_id: themeId,
        nominee_id: nomineeId,
        nominee_department_id: nominee?.department_id || undefined,
        nominator_role: nominatorRole,
        headline: headline.trim(),
        justification: justification.trim(),
        specific_examples: examples.trim() ? examples.split('\n').filter(Boolean) : undefined,
        impact_metrics: impact.trim() ? impact.split('\n').filter(Boolean) : undefined,
      };
      const result = await createNomination.mutateAsync({ ...input, allowAppeals });
      setCreatedNominationId(result.id);
      setManagerApprovalPending((result as any).manager_approval_status === 'pending');

      // Save criteria evaluations
      if (criteriaEvaluations.length > 0 && tenantId) {
        const rows = criteriaEvaluations.map(ce => ({
          tenant_id: tenantId,
          nomination_id: result.id,
          criterion_id: ce.criterion_id,
          weight: ce.weight,
          justification: ce.justification.trim() || null,
        }));
        await supabase.from('nomination_criteria_evaluations').insert(rows);
      }

      // Auto-advance to endorsement step
      setStep('request_endorsements');
    } catch {
      // error handled by mutation
    }
  };

  const isQuotaExhausted =
    (nominatorRole === 'manager' && managerQuota && managerQuota.remaining <= 0) ||
    (nominatorRole === 'peer' && peerQuota && peerQuota.remaining <= 0);

  const canProceed = () => {
    if (isQuotaExhausted && step === 'select_nominee') return false;
    switch (step) {
      case 'select_nominee':
        return !!nomineeId && !!nominatorRole;
      case 'justification':
        return !!headline.trim() && isJustificationValid;
      case 'criteria_evaluation':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress — only show for main 4 steps */}
      {step !== 'request_endorsements' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {VISIBLE_STEPS.map((s, i) => (
              <span key={s} className={i <= visibleStepIdx ? 'text-primary font-medium' : ''}>
                {t(`recognition.nominations.steps.${s}`)}
              </span>
            ))}
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Quota indicator for managers */}
      {nominatorRole === 'manager' && managerQuota && step === 'select_nominee' && (
        <QuotaIndicator type="manager" used={managerQuota.used} total={managerQuota.total} teamSize={managerQuota.teamSize} />
      )}

      {/* Quota indicator for peers */}
      {nominatorRole === 'peer' && peerQuota && step === 'select_nominee' && (
        <QuotaIndicator type="peer" used={peerQuota.used} total={peerQuota.total} />
      )}

      {/* Step 1: Select Nominee */}
      {step === 'select_nominee' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('recognition.nominations.selectNominee')}
            </CardTitle>
            <CardDescription>{t('recognition.nominations.selectNomineeDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('recognition.nominations.yourRole')}</Label>
              <Select value={nominatorRole} onValueChange={(v) => setNominatorRole(v as typeof nominatorRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peer">{t('recognition.nominations.role.peer')}</SelectItem>
                  <SelectItem value="manager">{t('recognition.nominations.role.manager')}</SelectItem>
                  <SelectItem value="self">{t('recognition.nominations.role.self')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isPreselectedAlreadyNominated && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('recognition.nominations.alreadyNominatedInCycle', 'You have already nominated this person in this cycle. Please select a different colleague.')}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{t('recognition.nominations.nominee')}</Label>
              <Select value={nomineeId} onValueChange={setNomineeId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('recognition.nominations.selectEmployee')} />
                </SelectTrigger>
                <SelectContent>
              {eligibleEmployees.filter(e => !!e.user_id).map(emp => (
                    <SelectItem key={emp.user_id!} value={emp.user_id!}>
                      {emp.full_name} {emp.department ? `(${emp.department})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <p className="text-xs text-muted-foreground">
                  {selectedEmployee.role_title || ''} — {selectedEmployee.email}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Justification */}
      {step === 'justification' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('recognition.nominations.writeJustification')}
            </CardTitle>
            <CardDescription>{t('recognition.nominations.justificationDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('recognition.nominations.headline')}</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={t('recognition.nominations.headlinePlaceholder')}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-end">{headline.length}/100</p>
            </div>

            <div className="space-y-2">
              <Label>{t('recognition.nominations.justification')}</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder={t('recognition.nominations.justificationPlaceholder')}
                rows={6}
              />
              <div className="flex justify-between text-xs">
                <span className={!isJustificationValid && justificationLength > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                  {t('recognition.nominations.charRange', { min: 200, max: 10000 })}
                </span>
                <span className={isJustificationValid ? 'text-chart-2' : 'text-muted-foreground'}>
                  {justificationLength}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('recognition.nominations.examples')}</Label>
              <Textarea
                value={examples}
                onChange={(e) => setExamples(e.target.value)}
                placeholder={t('recognition.nominations.examplesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('recognition.nominations.impactMetrics')}</Label>
              <Textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder={t('recognition.nominations.impactPlaceholder')}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Criteria Evaluation */}
      {step === 'criteria_evaluation' && (
        <NominationCriteriaForm
          themeId={themeId}
          onSubmit={handleCriteriaSubmit}
          onBack={goPrev}
        />
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t('recognition.nominations.review')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('recognition.nominations.nominee')}</span>
                <span className="font-medium">{selectedEmployee?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('recognition.nominations.yourRole')}</span>
                <Badge variant="outline">{t(`recognition.nominations.role.${nominatorRole}`)}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('recognition.nominations.headline')}</span>
                <span className="font-medium text-end max-w-[60%]">{headline}</span>
              </div>
              {allowAppeals && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('recognition.nominations.managerApproval')}</span>
                  <Badge variant="secondary">{t('recognition.nominations.managerApprovalStatus.pending')}</Badge>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4">{justification}</p>

            {/* Criteria evaluation summary */}
            {criteriaEvaluations.length > 0 && (
              <CriteriaWeightTable
                criteria={criteriaEvaluations.map(c => ({
                  name: c.name,
                  name_ar: c.name_ar,
                  description: c.description,
                  weight: c.weight,
                }))}
                label={t('recognition.criteriaEval.title')}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Request Endorsements (dedicated post-submission step) */}
      {step === 'request_endorsements' && createdNominationId && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle className="h-10 w-10 text-chart-2 mx-auto mb-2" />
            <p className="font-medium text-lg">{t('recognition.nominations.submitted')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('recognition.endorsements.endorsementStepDescription')}
            </p>
          </div>

          <EndorsementRequestPicker
            nominationId={createdNominationId}
            nomineeId={nomineeId}
            managerApprovalPending={managerApprovalPending}
            onComplete={onComplete}
          />

          {/* Always show a Done button at the bottom */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onComplete}>
              {t('common.done')}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation — skip for criteria_evaluation (has its own nav) and request_endorsements */}
      {step !== 'criteria_evaluation' && step !== 'request_endorsements' && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStepIdx === 0}
          >
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
            {t('common.back')}
          </Button>

          {step === 'review' ? (
            <Button onClick={handleSubmit} disabled={!canProceed() || createNomination.isPending}>
              {t('recognition.nominations.submitNomination')}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              {t('common.next')}
              <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
