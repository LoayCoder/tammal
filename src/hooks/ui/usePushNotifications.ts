import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      logger.error('usePushNotifications', 'Permission request failed', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return null;

      try {
        const notification = new Notification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options,
        });

        return notification;
      } catch (error) {
        logger.error('usePushNotifications', 'Send notification failed', error);
        return null;
      }
    },
    [isSupported, permission]
  );

  const sendServiceWorkerNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return false;

      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options,
        });
        return true;
      } catch (error) {
        logger.error('usePushNotifications', 'SW notification failed', error);
        return false;
      }
    },
    [isSupported, permission]
  );

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    sendNotification,
    sendServiceWorkerNotification,
  };
}
