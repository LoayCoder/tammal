import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { usePlatformSettings } from '@/hooks/org/usePlatformSettings';
import { toast } from 'sonner';

export default function DocumentSettings() {
  const { t } = useTranslation();
  
  const { allowSignup, showInvitation, isLoading, updateSettings } = usePlatformSettings();

  const handleToggle = async (field: 'allow_public_signup' | 'show_invitation_link', value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [field]: value });
      toast.success(t('toast.changesSaved'));
    } catch {
      toast.error(t('toast.saveFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><FileText className="h-6 w-6 text-primary" /></div>
          <h1 className="text-3xl font-bold tracking-tight">{t('documents.title')}</h1>
        </div>
      </div>

      <Card className="glass-card border-0 rounded-xl">
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
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader>
            <CardTitle>{t('documents.pdfTemplate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">PDF template settings coming soon...</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 rounded-xl">
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
