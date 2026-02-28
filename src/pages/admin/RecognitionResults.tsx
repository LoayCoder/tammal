import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calculator, Eye, Scale } from 'lucide-react';
import { useAwardCycles } from '@/hooks/recognition/useAwardCycles';
import { useResults } from '@/hooks/recognition/useResults';
import { useAppeals } from '@/hooks/recognition/useAppeals';
import { useAwardThemes } from '@/hooks/recognition/useAwardThemes';
import { FairnessReport } from '@/components/recognition/FairnessReport';
import { RankingsTable } from '@/components/recognition/RankingsTable';
import { WinnerAnnouncement } from '@/components/recognition/WinnerAnnouncement';
import { AppealForm } from '@/components/recognition/AppealForm';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function RecognitionResults() {
  const { t } = useTranslation();
  const { cycles, isPending: cyclesPending } = useAwardCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [showAppealForm, setShowAppealForm] = useState<string | null>(null);

  // Only show cycles that are calculating, announced, or archived
  const eligibleCycles = cycles.filter(c => ['calculating', 'voting', 'announced', 'archived'].includes(c.status));

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);
  const { results, rankings, resultsLoading } = useResults(selectedCycleId);
  const { appeals } = useAppeals(selectedCycleId);
  const { themes } = useAwardThemes(selectedCycleId);
  const { calculateResults } = useResults(selectedCycleId);

  // Fetch nominee names for rankings
  const nominationIds = rankings.map(r => r.nomination_id);
  const { data: nomineeNames = {} } = useQuery({
    queryKey: ['nominee-names', nominationIds],
    queryFn: async () => {
      if (!nominationIds.length) return {};
      const { data: noms } = await supabase
        .from('nominations')
        .select('id, nominee_id')
        .in('id', nominationIds);
      if (!noms?.length) return {};
      const userIds = [...new Set(noms.map(n => n.nominee_id))];
      const { data: emps } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .in('user_id', userIds);
      const nameMap = new Map(emps?.map(e => [e.user_id, e.full_name]) || []);
      const result: Record<string, string> = {};
      noms.forEach(n => { result[n.id] = nameMap.get(n.nominee_id) || 'Unknown'; });
      return result;
    },
    enabled: nominationIds.length > 0,
  });

  const handleCalculate = () => {
    if (selectedCycleId) calculateResults.mutate(selectedCycleId);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            {t('recognition.results.title')}
          </h1>
          <p className="text-muted-foreground">{t('recognition.results.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t('recognition.results.selectCycle')} />
            </SelectTrigger>
            <SelectContent>
              {eligibleCycles.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCycle && ['voting', 'calculating'].includes(selectedCycle.status) && (
            <Button onClick={handleCalculate} disabled={calculateResults.isPending}>
              <Calculator className="h-4 w-4 me-2" />
              {t('recognition.results.calculate')}
            </Button>
          )}
        </div>
      </div>

      {!selectedCycleId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('recognition.results.selectCyclePrompt')}</p>
          </CardContent>
        </Card>
      ) : resultsLoading || cyclesLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t('recognition.results.noResults')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('recognition.results.noResultsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="rankings">
          <TabsList>
            <TabsTrigger value="rankings">{t('recognition.results.rankingsTab')}</TabsTrigger>
            <TabsTrigger value="fairness">{t('recognition.results.fairnessTab')}</TabsTrigger>
            <TabsTrigger value="appeals">
              {t('recognition.results.appealsTab')}
              {appeals.length > 0 && (
                <Badge variant="secondary" className="ms-2">{appeals.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rankings" className="space-y-6 mt-4">
            {results.map(result => {
              const theme = themes.find(th => th.id === result.theme_id);
              const themeRankings = rankings.filter(r => r.theme_results_id === result.id);
              const winners = themeRankings.slice(0, 3).map(r => ({
                rank: r.rank,
                name: nomineeNames[r.nomination_id] || 'Unknown',
                score: r.weighted_average_score || 0,
              }));

              return (
                <div key={result.id} className="space-y-4">
                  {result.published_at && (
                    <WinnerAnnouncement winners={winners} themeName={theme?.name || ''} />
                  )}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{theme?.name || 'Theme'}</CardTitle>
                        <div className="flex items-center gap-2">
                          {!result.published_at && (
                            <Badge variant="outline">{t('recognition.results.unpublished')}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <RankingsTable rankings={themeRankings} nomineeNames={nomineeNames} />
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="fairness" className="space-y-6 mt-4">
            {results.map(result => {
              const theme = themes.find(th => th.id === result.theme_id);
              return (
                <div key={result.id}>
                  <h3 className="text-sm font-semibold mb-3">{theme?.name}</h3>
                  <FairnessReport report={result.fairness_report} />
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="appeals" className="space-y-4 mt-4">
            {showAppealForm ? (
              <AppealForm
                themeResultsId={showAppealForm}
                cycleId={selectedCycleId}
                onClose={() => setShowAppealForm(null)}
              />
            ) : (
              <>
                {results.some(r => r.published_at) && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowAppealForm(results[0]?.id)}>
                      <Scale className="h-4 w-4 me-2" />
                      {t('recognition.appeals.submitAppeal')}
                    </Button>
                  </div>
                )}
                {appeals.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {t('recognition.appeals.noAppeals')}
                    </CardContent>
                  </Card>
                ) : (
                  appeals.map(appeal => (
                    <Card key={appeal.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <Badge>{t(`recognition.appeals.groundTypes.${appeal.grounds}`)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(appeal.submitted_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{appeal.description}</p>
                        {appeal.resolved_at && (
                          <Badge variant="secondary" className="mt-2">{t('recognition.appeals.resolved')}</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
