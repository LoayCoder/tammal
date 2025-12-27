import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function UsageBilling() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('billing.title')}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('billing.userQuota')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>18 / 50 users</span>
              <span>36%</span>
            </div>
            <Progress value={36} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('billing.storageQuota')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>2.4 GB / 10 GB</span>
              <span>24%</span>
            </div>
            <Progress value={24} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('billing.invoices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
