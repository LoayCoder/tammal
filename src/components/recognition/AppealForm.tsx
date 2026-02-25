import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppeals } from '@/hooks/recognition/useAppeals';
import { Scale } from 'lucide-react';

interface AppealFormProps {
  themeResultsId: string;
  cycleId: string;
  onClose: () => void;
}

const GROUNDS = ['procedural_error', 'new_evidence', 'bias_allegation', 'scoring_discrepancy'] as const;

export function AppealForm({ themeResultsId, cycleId, onClose }: AppealFormProps) {
  const { t } = useTranslation();
  const { submitAppeal } = useAppeals(cycleId);
  const [grounds, setGrounds] = useState<string>('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!grounds || description.length < 50) return;
    submitAppeal.mutate(
      { theme_results_id: themeResultsId, grounds: grounds as any, description },
      { onSuccess: onClose },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4" />
          {t('recognition.appeals.submitAppeal')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t('recognition.appeals.grounds')}</Label>
          <Select value={grounds} onValueChange={setGrounds}>
            <SelectTrigger><SelectValue placeholder={t('recognition.appeals.selectGrounds')} /></SelectTrigger>
            <SelectContent>
              {GROUNDS.map(g => (
                <SelectItem key={g} value={g}>{t(`recognition.appeals.groundTypes.${g}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('recognition.appeals.description')}</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('recognition.appeals.descriptionPlaceholder')}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{description.length}/50 {t('recognition.voting.charsMin')}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSubmit}
            disabled={!grounds || description.length < 50 || submitAppeal.isPending}
          >
            {t('recognition.appeals.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
