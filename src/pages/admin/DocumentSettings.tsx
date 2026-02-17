import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useToast } from '@/hooks/use-toast';

export default function DocumentSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { allowSignup, showInvitation, isLoading, updateSettings } = usePlatformSettings();

  const handleToggle = async (field: 'allow_public_signup' | 'show_invitation_link', value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [field]: value });
      toast({ title: t('toast.success'), description: t('toast.changesSaved') });
    } catch {
      toast({ variant: 'destructive', title: t('toast.error'), description: t('toast.saveFailed') });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('documents.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('platformSettings.title')}</CardTitle>
          <CardDescription>{t('platformSettings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('platformSettings.allowSignup')}</Label>
              <p className="text-sm text-muted-foreground">{t('platformSettings.allowSignupDesc')}</p>
            </div>
            <Switch
              checked={allowSignup}
              onCheckedChange={(v) => handleToggle('allow_public_signup', v)}
              disabled={isLoading || updateSettings.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('platformSettings.showInvitation')}</Label>
              <p className="text-sm text-muted-foreground">{t('platformSettings.showInvitationDesc')}</p>
            </div>
            <Switch
              checked={showInvitation}
              onCheckedChange={(v) => handleToggle('show_invitation_link', v)}
              disabled={isLoading || updateSettings.isPending}
            />
          </div>
        </CardContent>
      </Card>

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
