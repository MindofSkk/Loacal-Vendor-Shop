import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getOrderItemCount, getOrderTotal, getShortOrderId } from '../utils/orderStatus';

const SellerOrdersContext = createContext(null);

export const SellerOrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');
  const knownOrderIds = useRef(new Set());
  const initialLoad = useRef(true);

  const refreshSellerOrders = useCallback(async ({ silent = true } = {}) => {
    if (user?.role !== 'seller') {
      setOrders([]);
      return [];
    }
    if (!silent) setLoadingOrders(true);
    setError('');

    try {
      const { data } = await orderApi.sellerOrders();
      setOrders(data);

      if (!initialLoad.current) {
        data.forEach((order) => {
          if (!knownOrderIds.current.has(order._id) && order.status === 'Pending') {
            toast.info({
              title: 'New order received',
              message: `Order #${getShortOrderId(order)} • ${getOrderItemCount(order)} items • ₹${getOrderTotal(order)}`,
              key: `seller-new-order-${order._id}`,
              actionLabel: 'View Order',
              onAction: () => navigate(`/seller?tab=orders&q=${getShortOrderId(order)}`)
            });
          }
        });
      }

      knownOrderIds.current = new Set(data.map((order) => order._id));
      initialLoad.current = false;
      return data;
    } catch (err) {
      if (!silent) setError(getApiError(err));
      return [];
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  }, [navigate, toast, user?.role]);

  const updateSellerOrderLocal = useCallback((order) => {
    if (!order) return;
    setOrders((current) => current.map((item) => (item._id === order._id ? { ...item, ...order } : item)));
  }, []);

  useEffect(() => {
    initialLoad.current = true;
    knownOrderIds.current = new Set();
    if (user?.role === 'seller') {
      refreshSellerOrders({ silent: false });
    } else {
      setOrders([]);
    }
  }, [refreshSellerOrders, user?.role]);

  useEffect(() => {
    if (user?.role !== 'seller') return undefined;

    const tick = () => {
      if (document.visibilityState === 'visible') {
        refreshSellerOrders({ silent: true });
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
  }, [refreshSellerOrders, user?.role]);

  const value = useMemo(
    () => ({
      orders,
      setOrders,
      loadingOrders,
      error,
      refreshSellerOrders,
      updateSellerOrderLocal
    }),
    [error, loadingOrders, orders, refreshSellerOrders, updateSellerOrderLocal]
  );

  return <SellerOrdersContext.Provider value={value}>{children}</SellerOrdersContext.Provider>;
};

export const useSellerOrders = () => useContext(SellerOrdersContext);
