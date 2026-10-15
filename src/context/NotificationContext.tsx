'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { notificationsService, AppNotification, NotificationType } from '@/services/notifications.service';

export type { AppNotification, NotificationType };

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addNotification: (
    item: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string; read?: boolean }
  ) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  setIsOpen: () => {},
  toggleOpen: () => {},
  addNotification: () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  removeNotification: async () => {},
  clearAll: async () => {},
  refreshNotifications: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const storageKey = useMemo(() => {
    return user?.id ? `followup_notifications_${user.id}` : null;
  }, [user?.id]);

  // Load from local cache initially when user changes
  useEffect(() => {
    if (!storageKey) {
      setNotifications([]);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Fetch real notifications from backend
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const remote = await notificationsService.getAll();
      setNotifications(remote);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(remote));
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }, [user?.id, storageKey]);

  // Initial load and periodic polling
  useEffect(() => {
    if (!user?.id) return;

    refreshNotifications();

    // Poll every 8 seconds for real-time notifications
    const interval = setInterval(() => {
      refreshNotifications();
    }, 8000);

    // Refresh when user returns to window tab
    const handleFocus = () => {
      refreshNotifications();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, refreshNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const addNotification = useCallback(
    (item: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string; read?: boolean }) => {
      const newNotif: AppNotification = {
        id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: item.type,
        title: item.title,
        message: item.message,
        timestamp: new Date().toISOString(),
        read: item.read ?? false,
        link: item.link,
        metadata: item.metadata,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [storageKey]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      await notificationsService.markAsRead(id);
    },
    [storageKey]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
    await notificationsService.markAllAsRead();
  }, [storageKey]);

  const removeNotification = useCallback(
    async (id: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      await notificationsService.remove(id);
    },
    [storageKey]
  );

  const clearAll = useCallback(async () => {
    setNotifications([]);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify([]));
      } catch {}
    }
    await notificationsService.removeAll();
  }, [storageKey]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        toggleOpen,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
