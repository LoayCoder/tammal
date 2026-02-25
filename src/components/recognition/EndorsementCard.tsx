import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ThumbsUp, CheckCircle } from 'lucide-react';
import type { PeerEndorsement, CreateEndorsementInput } from '@/hooks/recognition/useEndorsements';

interface EndorsementFormProps {
  nominationId: string;
  onSubmit: (input: CreateEndorsementInput) => void;
  isSubmitting?: boolean;
}

export function EndorsementForm({ nominationId, onSubmit, isSubmitting }: EndorsementFormProps) {
  const { t } = useTranslation();
  const [relationship, setRelationship] = useState<string>('');
  const [statement, setStatement] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = () => {
    if (!relationship || !statement.trim()) return;
    onSubmit({
      nomination_id: nominationId,
      relationship: relationship as CreateEndorsementInput['relationship'],
      confirmation_statement: statement.trim(),
      additional_context: context.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ThumbsUp className="h-4 w-4" />
          {t('recognition.endorsements.submitEndorsement')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t('recognition.endorsements.relationship')}</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger>
              <SelectValue placeholder={t('recognition.endorsements.selectRelationship')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct_colleague">{t('recognition.endorsements.relationships.directColleague')}</SelectItem>
              <SelectItem value="cross_functional">{t('recognition.endorsements.relationships.crossFunctional')}</SelectItem>
              <SelectItem value="client">{t('recognition.endorsements.relationships.client')}</SelectItem>
              <SelectItem value="reports_to">{t('recognition.endorsements.relationships.reportsTo')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('recognition.endorsements.confirmation')}</Label>
          <Textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder={t('recognition.endorsements.confirmationPlaceholder')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('recognition.endorsements.additionalContext')}</Label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t('recognition.endorsements.contextPlaceholder')}
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!relationship || !statement.trim() || isSubmitting}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 me-2" />
          {t('recognition.endorsements.submit')}
        </Button>
      </CardContent>
    </Card>
  );
}

interface EndorsementListItemProps {
  endorsement: PeerEndorsement;
  endorserName?: string;
}

export function EndorsementListItem({ endorsement, endorserName }: EndorsementListItemProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <ThumbsUp className="h-4 w-4 mt-0.5 text-chart-2 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{endorserName || t('common.unassigned')}</span>
          <Badge variant="outline" className="text-xs">
            {t(`recognition.endorsements.relationships.${endorsement.relationship.replace(/_/g, '')}`, endorsement.relationship)}
          </Badge>
          {endorsement.is_valid === false && (
            <Badge variant="destructive" className="text-xs">
              {t('recognition.endorsements.invalid')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{endorsement.confirmation_statement}</p>
        {endorsement.additional_context && (
          <p className="text-xs text-muted-foreground italic">{endorsement.additional_context}</p>
        )}
      </div>
    </div>
  );
}
