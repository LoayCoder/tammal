import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/system';

export default function Support() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Plus className="h-5 w-5 text-primary" />}
        title={t('support.title')}
        variant="card"
        actions={
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {t('support.newTicket')}
          </Button>
        }
      />

      <Card className="glass-card border-0 rounded-xl">
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
