import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getApiError } from '../api/client';
import { orderApi } from '../api/services';
import { navigateToOrderDetails } from '../navigation/navigationRef';
import {
  getOrderStatusMeta,
  getOrderSummary,
  getStatusToastMessage,
  isActiveOrderStatus,
  normalizeOrderStatus
} from '../utils/orderStatus';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const ActiveOrderContext = createContext(null);
const pollMs = 10000;

const byNewest = (orders) => [...orders].sort((first, second) => new Date(second.createdAt || second.updatedAt || 0) - new Date(first.createdAt || first.updatedAt || 0));

export function ActiveOrderProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const appStateRef = useRef(AppState.currentState);
  const foregroundRef = useRef(AppState.currentState === 'active');
  const activeOrderIdRef = useRef(null);
  const statusByOrderRef = useRef(new Map());
  const notifiedByOrderRef = useRef(new Map());
  const requestIdRef = useRef(0);

  const notifyStatusChange = useCallback((order, previousStatus, nextStatus) => {
    if (!order || !previousStatus || previousStatus === nextStatus) return;

    const notifyKey = `${order._id}:${nextStatus}`;
    if (notifiedByOrderRef.current.get(order._id) === notifyKey) return;
    notifiedByOrderRef.current.set(order._id, notifyKey);

    const shopName = order.shop?.name || 'the shop';
    const meta = getOrderStatusMeta(nextStatus);
    showToast({
      type: nextStatus === 'Delivered' ? 'success' : ['Cancelled', 'Rejected'].includes(nextStatus) ? 'error' : 'info',
      message: getStatusToastMessage(nextStatus, shopName),
      actionLabel: 'View Order',
      onAction: () => navigateToOrderDetails(order),
      duration: 3000
    });

    if (meta.progressStep > 0) {
      // Keeps the metadata import meaningful for future notification expansion.
    }
  }, [showToast]);

  const applyOrders = useCallback((orders, { notify = true } = {}) => {
    const normalizedOrders = Array.isArray(orders) ? orders : orders ? [orders] : [];
    const sortedOrders = byNewest(normalizedOrders);
    const nextActiveOrders = sortedOrders.filter((order) => isActiveOrderStatus(order.status));
    const nextActiveOrder = nextActiveOrders[0] || null;
    const newestOrder = sortedOrders[0] || nextActiveOrder || null;

    sortedOrders.forEach((order) => {
      const nextStatus = normalizeOrderStatus(order.status);
      const previousStatus = statusByOrderRef.current.get(order._id);
      if (notify && previousStatus && previousStatus !== nextStatus) {
        notifyStatusChange(order, previousStatus, nextStatus);
      }
      statusByOrderRef.current.set(order._id, nextStatus);
    });

    activeOrderIdRef.current = nextActiveOrder?._id || null;
    setActiveOrders(nextActiveOrders);
    setActiveOrder(nextActiveOrder);
    if (newestOrder) setLatestOrder(newestOrder);
  }, [notifyStatusChange]);

  const setOrderAsActive = useCallback((order, { notify = false } = {}) => {
    if (!order) return;
    applyOrders([order], { notify });
  }, [applyOrders]);

  const refreshActiveOrder = useCallback(async ({ silent = true, notify = true } = {}) => {
    if (!isAuthenticated) return null;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!silent) setLoading(true);
    setError('');

    try {
      const activeOrderId = activeOrderIdRef.current;
      if (activeOrderId) {
        const { data } = await orderApi.get(activeOrderId);
        if (requestId !== requestIdRef.current) return data;
        applyOrders([data], { notify });
        return data;
      }

      const { data } = await orderApi.active();
      if (requestId !== requestIdRef.current) return data;
      applyOrders(data, { notify: false });
      return data;
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      if (!silent) showToast({ type: 'error', message });
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyOrders, isAuthenticated, showToast]);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveOrders([]);
      setActiveOrder(null);
      setLatestOrder(null);
      setLoading(false);
      setError('');
      activeOrderIdRef.current = null;
      statusByOrderRef.current.clear();
      notifiedByOrderRef.current.clear();
      return;
    }

    refreshActiveOrder({ silent: false, notify: false });
  }, [isAuthenticated, refreshActiveOrder]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      foregroundRef.current = nextState === 'active';

      if (isAuthenticated && previousState !== 'active' && nextState === 'active') {
        refreshActiveOrder({ silent: true, notify: true });
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, refreshActiveOrder]);

  useEffect(() => {
    if (!isAuthenticated || !activeOrder?._id || !foregroundRef.current) return undefined;

    const intervalId = setInterval(() => {
      if (foregroundRef.current && activeOrderIdRef.current) {
        refreshActiveOrder({ silent: true, notify: true });
      }
    }, pollMs);

    return () => clearInterval(intervalId);
  }, [activeOrder?._id, isAuthenticated, refreshActiveOrder]);

  const summary = useMemo(() => getOrderSummary(activeOrder), [activeOrder]);

  const value = useMemo(() => ({
    activeOrder,
    activeOrders,
    activeOrderId: activeOrder?._id || null,
    currentStatus: summary.status,
    shopName: summary.shopName,
    orderNumber: summary.orderNumber,
    totalAmount: summary.totalAmount,
    itemCount: summary.itemCount,
    estimatedDeliveryTime: summary.eta,
    updatedAt: summary.updatedAt,
    latestOrder,
    loading,
    error,
    refreshActiveOrder,
    setOrderAsActive
  }), [activeOrder, activeOrders, error, latestOrder, loading, refreshActiveOrder, setOrderAsActive, summary]);

  return <ActiveOrderContext.Provider value={value}>{children}</ActiveOrderContext.Provider>;
}

export const useActiveOrder = () => useContext(ActiveOrderContext);
