import { useState, useEffect } from 'react';
import { notificationService } from '../utils/notificationService';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        // Verificar se o serviço e a função existem
        if (!notificationService || typeof notificationService.getUnreadCount !== 'function') {
          console.error('notificationService.getUnreadCount não é uma função');
          return;
        }

        const count = await notificationService.getUnreadCount();
        if (isMounted) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Erro ao carregar contagem de notificações no hook:', error);
      }
    };

    loadUnreadCount();

    // Verificar se a função do listener existe antes de tentar usá-la
    let listener: { remove: () => void } | null = null;
    
    if (notificationService && typeof notificationService.addNotificationReceivedListener === 'function') {
      listener = notificationService.addNotificationReceivedListener(() => {
        loadUnreadCount();
      });
    } else {
      console.error('notificationService.addNotificationReceivedListener não é uma função');
    }

    return () => {
      isMounted = false;
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    };
  }, []);

  return { unreadCount };
};