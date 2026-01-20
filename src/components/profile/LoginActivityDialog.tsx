import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Shield,
  LogIn,
  LogOut,
  History
} from 'lucide-react';
import { useLoginHistory } from '@/hooks/useLoginHistory';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface LoginActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginActivityDialog({ open, onOpenChange }: LoginActivityDialogProps) {
  const { t, i18n } = useTranslation();
  const { loginHistory, isLoading } = useLoginHistory();
  const isRTL = i18n.language === 'ar';

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getEventIcon = (eventType: string, success: boolean) => {
    if (!success) return <XCircle className="h-4 w-4 text-destructive" />;
    
    switch (eventType) {
      case 'logout':
        return <LogOut className="h-4 w-4 text-muted-foreground" />;
      case 'failed_login':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <LogIn className="h-4 w-4 text-green-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: isRTL ? ar : enUS,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('profile.loginActivity')}
          </DialogTitle>
          <DialogDescription>
            {t('profile.loginActivityDescription')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[50vh] pe-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : loginHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('profile.noLoginHistory')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loginHistory.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    index === 0 ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    event.success 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {getEventIcon(event.event_type, event.success)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {event.success 
                            ? t(`profile.eventTypes.${event.event_type}`) 
                            : t('profile.failedLogin')
                          }
                        </span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {t('profile.mostRecent')}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getRelativeTime(event.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {/* Device & Browser */}
                      <span className="flex items-center gap-1">
                        {getDeviceIcon(event.device_type)}
                        {event.browser || t('profile.unknownBrowser')} 
                        {event.os && ` • ${event.os}`}
                      </span>

                      {/* Location */}
                      {(event.city || event.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[event.city, event.country].filter(Boolean).join(', ')}
                        </span>
                      )}

                      {/* IP Address */}
                      {event.ip_address && (
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <Globe className="h-3 w-3" />
                          {event.ip_address}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(event.created_at)}
                    </div>

                    {/* Failure reason */}
                    {!event.success && event.failure_reason && (
                      <p className="text-xs text-destructive">
                        {event.failure_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
