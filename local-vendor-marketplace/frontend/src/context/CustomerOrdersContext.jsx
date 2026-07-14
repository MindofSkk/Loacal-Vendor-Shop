import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getOrderStatusConfig, isTerminalOrderStatus } from '../utils/orderStatus';

const CustomerOrdersContext = createContext(null);

export const CustomerOrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');
  const lastActiveStatus = useRef({});
  const previousActiveOrders = useRef([]);
  const initialActiveLoad = useRef(true);

  const activeOrder = activeOrders[0] || null;

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (user?.role !== 'customer') return [];
    if (!silent) setLoadingOrders(true);
    setError('');

    try {
      const { data } = await orderApi.myOrders();
      setOrders(data);
      return data;
    } catch (err) {
      setError(getApiError(err));
      return [];
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  }, [user?.role]);

  const refreshActiveOrders = useCallback(async ({ silent = true } = {}) => {
    if (user?.role !== 'customer') {
      setActiveOrders([]);
      return [];
    }

    try {
      const { data } = await orderApi.active();
      const nextIds = new Set(data.map((order) => order._id));
      const disappearedOrders = previousActiveOrders.current.filter((order) => !nextIds.has(order._id));

      if (!initialActiveLoad.current && disappearedOrders.length > 0) {
        await Promise.all(
          disappearedOrders.map(async (previousOrder) => {
            try {
              const { data: freshOrder } = await orderApi.get(previousOrder._id);
              setOrders((current) =>
                current.map((order) => (order._id === freshOrder._id ? { ...order, ...freshOrder } : order))
              );
              if (lastActiveStatus.current[freshOrder._id] !== freshOrder.status && isTerminalOrderStatus(freshOrder.status)) {
                const statusToast = getOrderStatusConfig(freshOrder.status).customerToast(freshOrder.shop?.name);
                toast.showToast({
                  type: freshOrder.status === 'Delivered' ? 'success' : 'warning',
                  title: statusToast.title,
                  message: statusToast.message,
                  key: `customer-status-${freshOrder._id}-${freshOrder.status}`,
                  actionLabel: 'View Order',
                  onAction: () => navigate(`/orders/${freshOrder._id}`)
                });
              }
              lastActiveStatus.current[freshOrder._id] = freshOrder.status;
            } catch {
              // Ignore one-off detail refresh failures; the next manual orders refresh still works.
            }
          })
        );
      }

      setActiveOrders(data);
      previousActiveOrders.current = data;
      setOrders((current) => {
        if (!current.length) return current;
        const byId = new Map(data.map((order) => [order._id, order]));
        return current.map((order) => byId.get(order._id) || order);
      });

      if (!initialActiveLoad.current) {
        data.forEach((order) => {
          const previousStatus = lastActiveStatus.current[order._id];
          if (previousStatus && previousStatus !== order.status) {
            const statusToast = getOrderStatusConfig(order.status).customerToast(order.shop?.name);
            toast.showToast({
              type: order.status === 'Delivered' ? 'success' : isTerminalOrderStatus(order.status) ? 'warning' : 'info',
              title: statusToast.title,
              message: statusToast.message,
              key: `customer-status-${order._id}-${order.status}`,
              actionLabel: 'View Order',
              onAction: () => navigate(`/orders/${order._id}`)
            });
          }
          lastActiveStatus.current[order._id] = order.status;
        });
      }

      initialActiveLoad.current = false;
      return data;
    } catch (err) {
      if (!silent) setError(getApiError(err));
      return [];
    }
  }, [navigate, toast, user?.role]);

  const setCreatedOrderActive = useCallback((order) => {
    if (!order) return;
    setActiveOrders((current) => [order, ...current.filter((item) => item._id !== order._id)]);
    setOrders((current) => [order, ...current.filter((item) => item._id !== order._id)]);
    lastActiveStatus.current[order._id] = order.status;
  }, []);

  const updateOrderLocal = useCallback((order) => {
    if (!order) return;
    setOrders((current) => current.map((item) => (item._id === order._id ? { ...item, ...order } : item)));
    setActiveOrders((current) => {
      if (isTerminalOrderStatus(order.status)) return current.filter((item) => item._id !== order._id);
      const exists = current.some((item) => item._id === order._id);
      return exists ? current.map((item) => (item._id === order._id ? { ...item, ...order } : item)) : [order, ...current];
    });
  }, []);

  useEffect(() => {
    initialActiveLoad.current = true;
    lastActiveStatus.current = {};
    if (user?.role === 'customer') {
      loadOrders({ silent: true });
      refreshActiveOrders({ silent: true });
    } else {
      setOrders([]);
      setActiveOrders([]);
      previousActiveOrders.current = [];
    }
  }, [loadOrders, refreshActiveOrders, user?.role]);

  useEffect(() => {
    if (user?.role !== 'customer' || !activeOrder) return undefined;

    const tick = () => {
      if (document.visibilityState === 'visible') {
        refreshActiveOrders({ silent: true });
      }
    };
    const interval = window.setInterval(tick, 10000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeOrder, refreshActiveOrders, user?.role]);

  const value = useMemo(
    () => ({
      orders,
      activeOrders,
      activeOrder,
      loadingOrders,
      error,
      loadOrders,
      refreshActiveOrders,
      setCreatedOrderActive,
      updateOrderLocal
    }),
    [activeOrder, activeOrders, error, loadOrders, loadingOrders, orders, refreshActiveOrders, setCreatedOrderActive, updateOrderLocal]
  );

  return <CustomerOrdersContext.Provider value={value}>{children}</CustomerOrdersContext.Provider>;
};

export const useCustomerOrders = () => useContext(CustomerOrdersContext);
