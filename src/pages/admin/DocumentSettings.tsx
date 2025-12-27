import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentSettings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('documents.title')}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('documents.pdfTemplate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">PDF template settings coming soon...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('documents.notificationTemplate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Notification templates coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
