import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Loader2, 
  LogOut,
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SessionManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export function SessionManagementDialog({ open, onOpenChange }: SessionManagementDialogProps) {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const isRTL = i18n.language === 'ar';

  // Get device icon based on user agent
  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('phone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (device.toLowerCase().includes('tablet') || device.toLowerCase().includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  // Current session info from browser
  const getCurrentSession = (): SessionInfo => {
    const userAgent = navigator.userAgent;
    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    if (/tablet|ipad/i.test(userAgent)) device = 'Tablet';

    let browser = 'Unknown Browser';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    return {
      id: 'current',
      device,
      browser,
      location: t('profile.currentLocation'),
      lastActive: t('profile.activeNow'),
      isCurrent: true,
    };
  };

  const currentSession = getCurrentSession();

  const handleSignOutAllDevices = async () => {
    setIsRevokingAll(true);
    try {
      // Sign out from all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      toast.success(t('profile.allSessionsRevoked'));
      onOpenChange(false);
    } catch (error) {
      logger.error('SessionManagement', 'Failed to sign out all devices', error);
      toast.error(t('profile.revokeSessionError'));
    } finally {
      setIsRevokingAll(false);
    }
  };

  const handleSignOutOtherDevices = async () => {
    setIsRevokingAll(true);
    try {
      // Sign out from other sessions (keeping current)
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;

      toast.success(t('profile.otherSessionsRevoked'));
    } catch (error) {
      logger.error('SessionManagement', 'Failed to sign out other devices', error);
      toast.error(t('profile.revokeSessionError'));
    } finally {
      setIsRevokingAll(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('profile.sessionManagement')}
          </DialogTitle>
          <DialogDescription>
            {t('profile.sessionManagementDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Session */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('profile.currentSession')}</h4>
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-primary/5">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {getDeviceIcon(currentSession.device)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {currentSession.device} • {currentSession.browser}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {t('profile.thisDevice')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {currentSession.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {currentSession.lastActive}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Session Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('profile.sessionSecurityNote')}
            </AlertDescription>
          </Alert>

          {/* Last Sign In Info */}
          {user?.last_sign_in_at && (
            <div className="p-3 border rounded-lg space-y-2">
              <h4 className="text-sm font-medium">{t('profile.lastSignInInfo')}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDate(user.last_sign_in_at)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOutOtherDevices}
              disabled={isRevokingAll}
            >
              {isRevokingAll ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="me-2 h-4 w-4" />
              )}
              {t('profile.signOutOtherDevices')}
            </Button>

            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleSignOutAllDevices}
              disabled={isRevokingAll}
            >
              {isRevokingAll ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="me-2 h-4 w-4" />
              )}
              {t('profile.signOutAllDevices')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
