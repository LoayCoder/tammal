import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/system';
import { usePlatformSettings } from '@/hooks/org/usePlatformSettings';
import { toast } from 'sonner';
import { cardVariants, typography} from "@/theme/tokens";

export default function DocumentSettings() {
  const { t } = useTranslation();
  
  const { allowSignup, showInvitation, isPending: isLoading, updateSettings } = usePlatformSettings();

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
      <PageHeader
        icon={<FileText className="h-5 w-5 text-primary" />}
        title={t('documents.title')}
        variant="card"
      />

      <Card className={cardVariants.glass}>
        <CardHeader>
          <CardTitle>{t('platformSettings.title')}</CardTitle>
          <CardDescription>{t('platformSettings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('platformSettings.allowSignup')}</Label>
              <p className={typography.subtitle}>{t('platformSettings.allowSignupDesc')}</p>
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
              <p className={typography.subtitle}>{t('platformSettings.showInvitationDesc')}</p>
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
        <Card className={cardVariants.glass}>
          <CardHeader>
            <CardTitle>{t('documents.pdfTemplate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">PDF template settings coming soon...</p>
          </CardContent>
        </Card>
        <Card className={cardVariants.glass}>
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
