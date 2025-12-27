import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminBranding() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('branding.title')}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('branding.primaryColor')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Color picker coming soon...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('branding.logo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Logo upload coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
