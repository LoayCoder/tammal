import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NominationWizard } from '@/components/recognition/NominationWizard';
import { useAwardCycles } from '@/hooks/recognition/useAwardCycles';
import { useAwardThemes } from '@/hooks/recognition/useAwardThemes';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function NominatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedCycleId = searchParams.get('cycle') || '';
  const preselectedThemeId = searchParams.get('theme') || '';

  const { cycles } = useAwardCycles();
  const activeCycles = cycles.filter(c => c.status === 'nominating');

  const [selectedCycleId, setSelectedCycleId] = useState(preselectedCycleId);
  const [selectedThemeId, setSelectedThemeId] = useState(preselectedThemeId);

  const { themes } = useAwardThemes(selectedCycleId || undefined);

  const showWizard = selectedCycleId && selectedThemeId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            {t('recognition.nominations.nominate')}
          </h1>
          <p className="text-muted-foreground">{t('recognition.nominations.nominateDesc')}</p>
        </div>
      </div>

      {activeCycles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('recognition.nominations.noActiveCycles')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!showWizard && (
            <Card>
              <CardHeader>
                <CardTitle>{t('recognition.nominations.selectCycleTheme')}</CardTitle>
                <CardDescription>{t('recognition.nominations.selectCycleThemeDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('recognition.nominations.cycle')}</Label>
                  <Select value={selectedCycleId} onValueChange={(v) => { setSelectedCycleId(v); setSelectedThemeId(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('recognition.nominations.selectCycle')} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCycles.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCycleId && (
                  <div className="space-y-2">
                    <Label>{t('recognition.nominations.theme')}</Label>
                    <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('recognition.nominations.selectTheme')} />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map(th => (
                          <SelectItem key={th.id} value={th.id}>{th.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {showWizard && (
            <NominationWizard
              cycleId={selectedCycleId}
              themeId={selectedThemeId}
              onComplete={() => navigate('/recognition/my-nominations')}
            />
          )}
        </>
      )}
    </div>
  );
}
