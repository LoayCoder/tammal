import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { VotingBooth } from '@/components/recognition/VotingBooth';
import { useVoting } from '@/hooks/recognition/useVoting';
import { useAwardCycles } from '@/hooks/recognition/useAwardCycles';
import { Vote } from 'lucide-react';

export default function VotingBoothPage() {
  const { t } = useTranslation();
  const { cycles, isLoading: cyclesLoading } = useAwardCycles();
  const votingCycles = cycles.filter(c => c.status === 'voting');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  // Auto-select if only one voting cycle
  const effectiveCycleId = selectedCycleId || (votingCycles.length === 1 ? votingCycles[0].id : '');

  const {
    pendingBallots,
    completedCount,
    totalCount,
    ballotsLoading,
    submitVote,
  } = useVoting(effectiveCycleId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Vote className="h-6 w-6" />
          {t('recognition.voting.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('recognition.voting.subtitle')}</p>
      </div>

      {/* Cycle selector */}
      {cyclesLoading ? (
        <Skeleton className="h-10 w-64" />
      ) : votingCycles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('recognition.voting.noVotingCycles')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {votingCycles.length > 1 && (
            <div className="space-y-1">
              <Label>{t('recognition.nominations.cycle')}</Label>
              <Select value={effectiveCycleId} onValueChange={setSelectedCycleId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder={t('recognition.nominations.selectCycle')} />
                </SelectTrigger>
                <SelectContent>
                  {votingCycles.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {effectiveCycleId && (
            ballotsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <VotingBooth
                ballots={pendingBallots}
                completedCount={completedCount}
                totalCount={totalCount}
                onSubmit={(data) => submitVote.mutate(data)}
                isSubmitting={submitVote.isPending}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
