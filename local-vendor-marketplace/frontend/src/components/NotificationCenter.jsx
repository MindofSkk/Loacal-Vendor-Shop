import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiError } from '../api/client';
import { notificationApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerBrowserPushToken, requestBrowserNotificationPermission } from '../services/browserNotifications';

const getItems = (payload) => (Array.isArray(payload) ? payload : payload?.items || []);

export default function NotificationCenter() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const canShow = user?.role === 'customer' || user?.role === 'seller';

  const loadNotifications = async () => {
    if (!canShow) return;
    setLoading(true);
    try {
      const { data } = await notificationApi.list({ limit: 10 });
      setItems(getItems(data));
      setUnreadCount(data?.unreadCount ?? getItems(data).filter((item) => !item.isRead).length);
    } catch (err) {
      toast.error({ title: 'Notifications failed', message: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canShow) loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShow, user?._id]);

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await notificationApi.markRead(notification._id);
      setItems((current) => current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    const orderId = notification.data?.orderId || notification.orderId;
    if (orderId && user?.role === 'customer') navigate(`/orders/${orderId}`);
    if (orderId && user?.role === 'seller') navigate(`/seller?tab=orders&q=${String(orderId).slice(-6)}`);
    setOpen(false);
  };

  const enableBrowserAlerts = async () => {
    const permission = await requestBrowserNotificationPermission();
    if (permission === 'granted') {
      const result = await registerBrowserPushToken();
      toast.info({
        title: result.configured ? 'Browser alerts enabled' : 'Browser alerts need setup',
        message: result.configured ? 'You will receive browser order notifications.' : result.reason
      });
    } else if (permission === 'denied') {
      toast.warning({ title: 'Permission denied', message: 'In-app notifications will continue to work.' });
    } else {
      toast.info({ title: 'Browser alerts skipped', message: 'You can enable them later from this menu.' });
    }
  };

  const title = useMemo(() => (user?.role === 'seller' ? 'Seller notifications' : 'Notifications'), [user?.role]);

  if (!canShow) return null;

  return (
    <div className="relative">
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (!open) loadNotifications();
        }}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-3">
            <div>
              <p className="text-sm font-bold text-slate-950">{title}</p>
              <p className="text-xs font-semibold text-slate-500">{unreadCount} unread</p>
            </div>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={markAllRead} title="Mark all read">
              <CheckCheck className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {loading && <p className="p-3 text-sm text-slate-500">Loading...</p>}
            {!loading && items.length === 0 && <p className="p-3 text-sm text-slate-500">No notifications yet.</p>}
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                className={`mb-2 w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${item.isRead ? 'bg-white' : 'bg-violet-50'}`}
                onClick={() => openNotification(item)}
              >
                <p className="text-sm font-bold text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{item.body || item.message}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2">
            <button className="w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-100" type="button" onClick={enableBrowserAlerts}>
              Enable browser alerts
              <span className="mt-0.5 block font-semibold text-slate-400">Firebase Web config required for push delivery.</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
