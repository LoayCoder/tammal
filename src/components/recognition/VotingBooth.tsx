import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CriterionScorer } from './CriterionScorer';
import { VotingProgress } from './VotingProgress';
import type { Ballot } from '@/hooks/recognition/useVoting';
import { ChevronRight, ChevronLeft, Send, CheckCircle } from 'lucide-react';

interface VotingBoothProps {
  ballots: Ballot[];
  completedCount: number;
  totalCount: number;
  onSubmit: (data: {
    nomination_id: string;
    theme_id: string;
    cycle_id: string;
    criteria_scores: Record<string, number>;
    justifications: Record<string, string>;
    confidence_level: 'high' | 'medium' | 'low';
  }) => void;
  isSubmitting: boolean;
}

export function VotingBooth({ ballots, completedCount, totalCount, onSubmit, isSubmitting }: VotingBoothProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');

  const ballot = ballots[currentIdx];

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

  const canSubmit = ballot.criteria.every(c => {
    const score = scores[c.id];
    if (!score) return false;
    if ((score === 1 || score === 5) && (!justifications[c.id] || justifications[c.id].length < 50)) return false;
    return true;
  });

  const handleSubmit = () => {
    onSubmit({
      nomination_id: ballot.nomination_id,
      theme_id: ballot.theme_id,
      cycle_id: ballot.cycle_id,
      criteria_scores: scores,
      justifications,
      confidence_level: confidence,
    });
    // Reset and advance
    setScores({});
    setJustifications({});
    setConfidence('medium');
    if (currentIdx < ballots.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  // Initialize scores to 3 if empty
  if (ballot.criteria.length > 0 && Object.keys(scores).length === 0) {
    const initial: Record<string, number> = {};
    ballot.criteria.forEach(c => { initial[c.id] = 3; });
    setScores(initial);
  }

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

          {/* Criteria scorers */}
          <div className="space-y-3">
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
