import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, differenceInDays } from 'date-fns';
import { Calendar, Play, Clock, StopCircle, CalendarPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TRIAL_DURATIONS = [7, 14, 30, 60, 90] as const;

interface TrialData {
  subscription_status: string;
  trial_start_date: string | null;
  trial_end_date: string | null;
}

interface TenantTrialControlProps {
  tenantId: string;
  trialData: TrialData;
  onStartTrial: (days: number) => void;
  onExtendTrial: (params: { days?: number; endDate?: string }) => void;
  onEndTrial: () => void;
  isUpdating: boolean;
}

export function TenantTrialControl({
  tenantId,
  trialData,
  onStartTrial,
  onExtendTrial,
  onEndTrial,
  isUpdating,
}: TenantTrialControlProps) {
  const { t } = useTranslation();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('14');
  const [extendDays, setExtendDays] = useState<string>('7');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const isTrialing = trialData.subscription_status === 'trialing';
  const hasTrialDates = trialData.trial_start_date && trialData.trial_end_date;
  
  const daysRemaining = hasTrialDates && isTrialing
    ? differenceInDays(new Date(trialData.trial_end_date!), new Date())
    : 0;

  const handleStartTrial = () => {
    onStartTrial(parseInt(selectedDuration));
    setShowStartDialog(false);
  };

  const handleExtendTrial = () => {
    if (customEndDate) {
      onExtendTrial({ endDate: customEndDate });
    } else {
      onExtendTrial({ days: parseInt(extendDays) });
    }
    setShowExtendDialog(false);
  };

  const handleEndTrial = () => {
    onEndTrial();
    setShowEndDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('tenants.trialManagement')}</CardTitle>
              <CardDescription>{t('tenants.trialManagementDescription')}</CardDescription>
            </div>
            {isTrialing && (
              <Badge variant={daysRemaining <= 3 ? 'destructive' : 'default'}>
                {t('tenants.daysRemaining', { count: daysRemaining })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{t('tenants.subscriptionStatus')}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {t(`tenants.statuses.${trialData.subscription_status}`)}
                </Badge>
              </div>
            </div>
            
            {hasTrialDates && (
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{t('tenants.trialPeriod')}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(trialData.trial_start_date!), 'PP')} — {format(new Date(trialData.trial_end_date!), 'PP')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!isTrialing && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowStartDialog(true)}
                disabled={isUpdating}
              >
                <Play className="me-2 h-4 w-4" />
                {t('tenants.startTrial')}
              </Button>
            )}

            {isTrialing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtendDialog(true)}
                  disabled={isUpdating}
                >
                  <CalendarPlus className="me-2 h-4 w-4" />
                  {t('tenants.extendTrial')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowEndDialog(true)}
                  disabled={isUpdating}
                >
                  <StopCircle className="me-2 h-4 w-4" />
                  {t('tenants.endTrial')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Start Trial Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenants.startTrial')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tenants.startTrialDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>{t('tenants.trialDuration')}</Label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIAL_DURATIONS.map((days) => (
                  <SelectItem key={days} value={days.toString()}>
                    {t('tenants.daysCount', { count: days })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartTrial}>
              {t('tenants.startTrial')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Trial Dialog */}
      <AlertDialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenants.extendTrial')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tenants.extendTrialDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>{t('tenants.extendByDays')}</Label>
              <Select value={extendDays} onValueChange={(v) => { setExtendDays(v); setCustomEndDate(''); }}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[7, 14, 30].map((days) => (
                    <SelectItem key={days} value={days.toString()}>
                      {t('tenants.daysCount', { count: days })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('tenants.orSetEndDate')}</Label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => { setCustomEndDate(e.target.value); setExtendDays(''); }}
                className="mt-2"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleExtendTrial}>
              {t('tenants.extendTrial')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Trial Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenants.endTrial')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tenants.endTrialDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndTrial} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('tenants.endTrial')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
