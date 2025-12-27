import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Support() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('support.title')}</h1>
        </div>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          {t('support.newTicket')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('support.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
