import { CheckCircle2, Clock, CookingPot, Home, PackageCheck, XCircle } from 'lucide-react';

export const orderStatusConfig = {
  Pending: {
    label: 'Pending',
    tone: 'bg-amber-100 text-amber-800',
    icon: Clock,
    step: 0,
    terminal: false,
    activeMessage: (shopName = 'the shop') => `Waiting for ${shopName} to accept your order`,
    customerToast: (shopName = 'the shop') => ({
      title: 'Order placed',
      message: `Waiting for ${shopName} to accept your order`
    })
  },
  Accepted: {
    label: 'Accepted',
    tone: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2,
    step: 1,
    terminal: false,
    activeMessage: () => 'Your order has been accepted',
    customerToast: (shopName = 'the seller') => ({
      title: `Order accepted by ${shopName}`,
      message: 'Your order has been accepted'
    })
  },
  Packed: {
    label: 'Preparing',
    tone: 'bg-indigo-100 text-indigo-800',
    icon: CookingPot,
    step: 2,
    terminal: false,
    activeMessage: () => 'Your order is being prepared',
    customerToast: () => ({
      title: 'Your order is being prepared',
      message: 'The seller is packing your items'
    })
  },
  'Out for Delivery': {
    label: 'Out for Delivery',
    tone: 'bg-sky-100 text-sky-800',
    icon: PackageCheck,
    step: 3,
    terminal: false,
    activeMessage: () => 'Your order is on the way',
    customerToast: () => ({
      title: 'Your order is out for delivery',
      message: 'Your order is on the way'
    })
  },
  Delivered: {
    label: 'Delivered',
    tone: 'bg-emerald-100 text-emerald-800',
    icon: Home,
    step: 4,
    terminal: true,
    activeMessage: () => 'Your order has been delivered',
    customerToast: () => ({
      title: 'Order delivered successfully',
      message: 'Thanks for ordering with LocalShop'
    })
  },
  Cancelled: {
    label: 'Cancelled',
    tone: 'bg-red-100 text-red-800',
    icon: XCircle,
    step: -1,
    terminal: true,
    activeMessage: () => 'Your order has been cancelled',
    customerToast: () => ({
      title: 'Your order has been cancelled',
      message: 'The order is now closed'
    })
  },
  Rejected: {
    label: 'Rejected',
    tone: 'bg-red-100 text-red-800',
    icon: XCircle,
    step: -1,
    terminal: true,
    activeMessage: () => 'Your order was rejected by the seller',
    customerToast: () => ({
      title: 'Your order was rejected by the seller',
      message: 'Please try another shop nearby'
    })
  }
};

export const getOrderStatusConfig = (status) =>
  orderStatusConfig[status] || {
    label: status || 'Unknown',
    tone: 'bg-slate-100 text-slate-700',
    icon: Clock,
    step: -1,
    terminal: false,
    activeMessage: () => status || 'Order status updated',
    customerToast: () => ({ title: 'Order updated', message: status || 'Order status updated' })
  };

export const isTerminalOrderStatus = (status) => Boolean(getOrderStatusConfig(status).terminal);

export const getShortOrderId = (order) => String(order?._id || '').slice(-6).toUpperCase();

export const getOrderItemCount = (order) =>
  (order?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

export const getOrderTotal = (order) => Number(order?.total || order?.subtotal || 0);

export const getOrderStatusMessage = (order) => {
  const shopName = order?.shop?.name || 'the shop';
  return getOrderStatusConfig(order?.status).activeMessage(shopName);
};

export const nextSellerStatuses = (status) => {
  const flow = {
    Pending: ['Accepted', 'Rejected'],
    Accepted: ['Packed', 'Cancelled'],
    Packed: ['Out for Delivery', 'Cancelled'],
    'Out for Delivery': ['Delivered'],
    Delivered: [],
    Cancelled: [],
    Rejected: []
  };

  return flow[status] || [];
};
