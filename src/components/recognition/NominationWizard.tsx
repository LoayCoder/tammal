import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QuotaIndicator } from './QuotaIndicator';
import { EndorsementForm } from './EndorsementCard';
import { useNominations, useManagerQuota, type CreateNominationInput } from '@/hooks/recognition/useNominations';
import { useEndorsements } from '@/hooks/recognition/useEndorsements';
import { useEmployees } from '@/hooks/org/useEmployees';
import { useAuth } from '@/hooks/auth/useAuth';
import { User, FileText, ThumbsUp, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface NominationWizardProps {
  cycleId: string;
  themeId: string;
  onComplete?: () => void;
}

type Step = 'select_nominee' | 'justification' | 'endorsements' | 'review';
const STEPS: Step[] = ['select_nominee', 'justification', 'endorsements', 'review'];

export function NominationWizard({ cycleId, themeId, onComplete }: NominationWizardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createNomination } = useNominations();
  const { data: quota } = useManagerQuota(themeId);
  const { employees = [] } = useEmployees();

  const [step, setStep] = useState<Step>('select_nominee');
  const [nomineeId, setNomineeId] = useState('');
  const [nominatorRole, setNominatorRole] = useState<'manager' | 'peer' | 'self'>('peer');
  const [headline, setHeadline] = useState('');
  const [justification, setJustification] = useState('');
  const [examples, setExamples] = useState('');
  const [impact, setImpact] = useState('');
  const [createdNominationId, setCreatedNominationId] = useState<string | null>(null);

  const currentStepIdx = STEPS.indexOf(step);
  const progressPercent = ((currentStepIdx + 1) / STEPS.length) * 100;
  const justificationLength = justification.trim().length;
  const isJustificationValid = justificationLength >= 200 && justificationLength <= 10000;

  const selectedEmployee = employees.find(e => e.id === nomineeId);

  // Filter out self from employee list (unless self-nomination)
  const eligibleEmployees = employees.filter(e => e.user_id !== user?.id || nominatorRole === 'self');

  const goNext = () => {
    const idx = currentStepIdx + 1;
    if (idx < STEPS.length) setStep(STEPS[idx]);
  };

  const goPrev = () => {
    const idx = currentStepIdx - 1;
    if (idx >= 0) setStep(STEPS[idx]);
  };

  const handleSubmit = async () => {
    try {
      const nominee = employees.find(e => e.id === nomineeId);
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
      const result = await createNomination.mutateAsync(input);
      setCreatedNominationId(result.id);
      goNext(); // go to endorsements step
    } catch {
      // error handled by mutation
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'select_nominee':
        return !!nomineeId && !!nominatorRole;
      case 'justification':
        return !!headline.trim() && isJustificationValid;
      case 'endorsements':
        return true; // optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= currentStepIdx ? 'text-primary font-medium' : ''}>
              {t(`recognition.nominations.steps.${s}`)}
            </span>
          ))}
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Quota indicator for managers */}
      {nominatorRole === 'manager' && quota && (
        <QuotaIndicator used={quota.used} total={quota.total} teamSize={quota.teamSize} />
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

            <div className="space-y-2">
              <Label>{t('recognition.nominations.nominee')}</Label>
              <Select value={nomineeId} onValueChange={setNomineeId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('recognition.nominations.selectEmployee')} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
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

      {/* Step 3: Endorsements */}
      {step === 'endorsements' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              {t('recognition.endorsements.title')}
            </CardTitle>
            <CardDescription>{t('recognition.endorsements.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('recognition.endorsements.requestNote')}
            </p>
            <Button variant="outline" onClick={goNext}>
              {t('recognition.nominations.skipForNow')}
            </Button>
          </CardContent>
        </Card>
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
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4">{justification}</p>

            {createdNominationId ? (
              <div className="text-center py-4">
                <CheckCircle className="h-10 w-10 text-chart-2 mx-auto mb-2" />
                <p className="font-medium">{t('recognition.nominations.submitted')}</p>
                <Button variant="outline" className="mt-3" onClick={onComplete}>
                  {t('common.done')}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStepIdx === 0}
        >
          <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
          {t('common.back')}
        </Button>

        {step === 'justification' ? (
          <Button onClick={handleSubmit} disabled={!canProceed() || createNomination.isPending}>
            {t('recognition.nominations.submitNomination')}
          </Button>
        ) : step !== 'review' ? (
          <Button onClick={goNext} disabled={!canProceed()}>
            {t('common.next')}
            <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
