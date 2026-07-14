import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getApiError } from '../api/client';
import { notificationApi } from '../api/services';
import {
  consumePendingNotificationTarget,
  openNotificationTarget,
  registerForPushNotifications,
  unregisterPushToken
} from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const seenForegroundRef = useRef(new Set());

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await notificationApi.list({ limit: 30 });
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Notification center is non-critical.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const openTarget = useCallback(async (data) => {
    try {
      await openNotificationTarget(data, isAuthenticated);
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    registerForPushNotifications().catch(() => {});
    loadNotifications();
    consumePendingNotificationTarget().then((target) => {
      if (target) openTarget(target);
    });

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data || {};
      const eventKey = `${data.type || 'notification'}:${data.orderId || ''}:${content.title || ''}`;
      if (seenForegroundRef.current.has(eventKey)) return;
      seenForegroundRef.current.add(eventKey);
      setUnreadCount((count) => count + 1);
      loadNotifications();
      showToast({
        type: 'info',
        message: `${content.title || 'Notification'}${content.body ? ` - ${content.body}` : ''}`,
        actionLabel: data.orderId ? 'View Order' : undefined,
        onAction: data.orderId ? () => openTarget(data) : undefined,
        duration: 4000
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      openTarget(response.notification.request.content.data || {});
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openTarget(response.notification.request.content.data || {});
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated, loadNotifications, openTarget, showToast]);

  useEffect(() => {
    if (isAuthenticated) return;
    setNotifications([]);
    setUnreadCount(0);
  }, [isAuthenticated]);

  const markRead = useCallback(async (notification) => {
    if (!notification?._id) return;
    if (!notification.isRead) {
      await notificationApi.markRead(notification._id);
      setNotifications((current) => current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    await openTarget(notification.data || {});
  }, [openTarget]);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead();
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  }, []);

  const logoutNotifications = useCallback(async () => {
    await unregisterPushToken().catch(() => {});
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markRead,
    markAllRead,
    logoutNotifications
  }), [loadNotifications, loading, logoutNotifications, markAllRead, markRead, notifications, unreadCount]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
