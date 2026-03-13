import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CriterionScorer } from './CriterionScorer';
import { CriteriaWeightSlider } from './CriteriaWeightSlider';
import { VotingProgress } from './VotingProgress';
import type { Ballot } from '@/features/recognition/hooks/recognition/useVoting';
import { ChevronRight, ChevronLeft, Send, CheckCircle, AlertTriangle } from 'lucide-react';

interface VotingBoothProps {
  ballots: Ballot[];
  completedCount: number;
  totalCount: number;
  votingWeightAdjustmentLimit: number; // ±percentage
  onSubmit: (data: {
    nomination_id: string;
    theme_id: string;
    cycle_id: string;
    criteria_scores: Record<string, number>;
    justifications: Record<string, string>;
    confidence_level: 'high' | 'medium' | 'low';
    adjusted_weights: Record<string, { original: number; adjusted: number }>;
  }) => void;
  isSubmitting: boolean;
}

export function VotingBooth({ ballots, completedCount, totalCount, votingWeightAdjustmentLimit, onSubmit, isSubmitting }: VotingBoothProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [adjustedWeights, setAdjustedWeights] = useState<Record<string, number>>({});
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');

  const ballot = ballots[currentIdx];

  // Initialize scores and weights when ballot changes
  useEffect(() => {
    if (ballot && ballot.criteria.length > 0) {
      const initialScores: Record<string, number> = {};
      const initialWeights: Record<string, number> = {};
      ballot.criteria.forEach(c => {
        initialScores[c.id] = 3;
        initialWeights[c.id] = Math.round(c.weight * 100); // convert decimal to percentage
      });
      setScores(initialScores);
      setAdjustedWeights(initialWeights);
      setJustifications({});
      setConfidence('medium');
    }
  }, [ballot?.nomination_id]);

  const totalAdjustedWeight = useMemo(
    () => Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0),
    [adjustedWeights]
  );
  const isWeightValid = Math.abs(totalAdjustedWeight - 100) < 0.5;

  if (!ballot) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-3">
          <CheckCircle className="h-12 w-12 text-primary" />
          <p className="text-lg font-medium">{t('recognition.voting.allDone')}</p>
          <p className="text-sm text-muted-foreground">{t('recognition.voting.allDoneDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: score }));
  };

  const handleJustificationChange = (criterionId: string, text: string) => {
    setJustifications(prev => ({ ...prev, [criterionId]: text }));
  };

  const handleWeightChange = (criterionId: string, weight: number) => {
    setAdjustedWeights(prev => ({ ...prev, [criterionId]: weight }));
  };

  const canSubmit = ballot.criteria.every(c => {
    const score = scores[c.id];
    if (!score) return false;
    if ((score === 1 || score === 5) && (!justifications[c.id] || justifications[c.id].length < 50)) return false;
    return true;
  }) && isWeightValid;

  const handleSubmit = () => {
    const weightData: Record<string, { original: number; adjusted: number }> = {};
    ballot.criteria.forEach(c => {
      weightData[c.id] = {
        original: Math.round(c.weight * 100),
        adjusted: adjustedWeights[c.id] ?? Math.round(c.weight * 100),
      };
    });

    onSubmit({
      nomination_id: ballot.nomination_id,
      theme_id: ballot.theme_id,
      cycle_id: ballot.cycle_id,
      criteria_scores: scores,
      justifications,
      confidence_level: confidence,
      adjusted_weights: weightData,
    });
    // Reset and advance
    setScores({});
    setJustifications({});
    setAdjustedWeights({});
    setConfidence('medium');
    if (currentIdx < ballots.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      <VotingProgress completed={completedCount} total={totalCount} currentIndex={currentIdx} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{ballot.nominee_name}</CardTitle>
              <CardDescription>{ballot.theme_name} — {ballot.headline}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Justification excerpt */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('recognition.nominations.justification')}
            </Label>
            <p className="line-clamp-4">{ballot.justification}</p>
          </div>

          {/* Weight adjustment section */}
          {votingWeightAdjustmentLimit > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">{t('recognition.voting.adjustWeights')}</Label>
                <Badge variant={isWeightValid ? 'default' : 'destructive'}>
                  {t('recognition.criteria.totalWeight')}: {totalAdjustedWeight}%
                </Badge>
              </div>

              {!isWeightValid && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {t('recognition.criteriaEval.mustEqual100')}
                  </AlertDescription>
                </Alert>
              )}

              {ballot.criteria.map(criterion => (
                <CriteriaWeightSlider
                  key={`w-${criterion.id}`}
                  criterionName={criterion.name}
                  criterionDescription={criterion.description}
                  originalWeight={Math.round(criterion.weight * 100)}
                  adjustedWeight={adjustedWeights[criterion.id] ?? Math.round(criterion.weight * 100)}
                  adjustmentLimit={votingWeightAdjustmentLimit}
                  onChange={(w) => handleWeightChange(criterion.id, w)}
                />
              ))}
            </div>
          )}

          {/* Criteria scorers */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{t('recognition.voting.rateCriteria')}</Label>
            {ballot.criteria.map(criterion => (
              <CriterionScorer
                key={criterion.id}
                criterion={criterion}
                score={scores[criterion.id] || 3}
                justification={justifications[criterion.id] || ''}
                onScoreChange={(s) => handleScoreChange(criterion.id, s)}
                onJustificationChange={(t) => handleJustificationChange(criterion.id, t)}
              />
            ))}
          </div>

          {/* Confidence level */}
          <div className="space-y-1">
            <Label className="text-sm">{t('recognition.voting.confidence')}</Label>
            <Select value={confidence} onValueChange={(v) => setConfidence(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">{t('recognition.voting.confidenceHigh')}</SelectItem>
                <SelectItem value="medium">{t('recognition.voting.confidenceMedium')}</SelectItem>
                <SelectItem value="low">{t('recognition.voting.confidenceLow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Navigation + Submit */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
              {t('common.previous')}
            </Button>

            <div className="flex gap-2">
              {currentIdx < ballots.length - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                >
                  {t('recognition.voting.skip')}
                  <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
                </Button>
              )}
              <Button
                size="sm"
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
              >
                <Send className="h-4 w-4" />
                {t('recognition.voting.submitVote')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


