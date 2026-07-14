export const terminalOrderStatuses = ['Delivered', 'Cancelled', 'Rejected'];

export const normalizeOrderStatus = (status) => {
  const value = String(status || 'Pending').toLowerCase();
  if (value.includes('out')) return 'Out for Delivery';
  if (value.includes('deliver')) return 'Delivered';
  if (value.includes('accept')) return 'Accepted';
  if (value.includes('pack') || value.includes('prepar')) return 'Packed';
  if (value.includes('cancel')) return 'Cancelled';
  if (value.includes('reject')) return 'Rejected';
  return 'Pending';
};

export const isActiveOrderStatus = (status) => !terminalOrderStatuses.includes(normalizeOrderStatus(status));

export const orderStatusMeta = {
  Pending: {
    label: 'Order Placed',
    shortLabel: 'Placed',
    color: '#F59E0B',
    bg: '#FFFBEB',
    icon: 'receipt-outline',
    progressStep: 1,
    progressText: (shopName = 'the shop') => `Waiting for ${shopName} to accept your order`
  },
  Accepted: {
    label: 'Accepted',
    shortLabel: 'Accepted',
    color: '#5B2EEB',
    bg: '#F5F3FF',
    icon: 'checkmark-circle-outline',
    progressStep: 2,
    progressText: () => 'Your order has been accepted'
  },
  Packed: {
    label: 'Preparing',
    shortLabel: 'Preparing',
    color: '#5B2EEB',
    bg: '#F5F3FF',
    icon: 'restaurant-outline',
    progressStep: 3,
    progressText: () => 'Your order is being prepared'
  },
  'Out for Delivery': {
    label: 'Out for Delivery',
    shortLabel: 'On the way',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: 'bicycle-outline',
    progressStep: 4,
    progressText: () => 'Your order is on the way'
  },
  Delivered: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    color: '#16A34A',
    bg: '#ECFDF5',
    icon: 'home-outline',
    progressStep: 5,
    progressText: () => 'Your order has been delivered'
  },
  Rejected: {
    label: 'Rejected',
    shortLabel: 'Rejected',
    color: '#EF4444',
    bg: '#FEF2F2',
    icon: 'close-circle-outline',
    progressStep: 0,
    progressText: () => 'Your order was rejected by the seller'
  },
  Cancelled: {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    color: '#EF4444',
    bg: '#FEF2F2',
    icon: 'close-circle-outline',
    progressStep: 0,
    progressText: () => 'Your order has been cancelled'
  }
};

export const getOrderStatusMeta = (status) => orderStatusMeta[normalizeOrderStatus(status)] || orderStatusMeta.Pending;

export const getStatusToastMessage = (nextStatus, shopName = 'the shop') => {
  const normalized = normalizeOrderStatus(nextStatus);
  if (normalized === 'Accepted') return `Order accepted by ${shopName}`;
  if (normalized === 'Packed') return 'Your order is being prepared';
  if (normalized === 'Out for Delivery') return 'Your order is out for delivery';
  if (normalized === 'Delivered') return 'Order delivered successfully';
  if (normalized === 'Rejected') return 'Your order was rejected by the seller';
  if (normalized === 'Cancelled') return 'Your order has been cancelled';
  return getOrderStatusMeta(normalized).progressText(shopName);
};

export const getOrderSummary = (order) => {
  const items = order?.items || [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalAmount = Number(order?.totalAmount ?? order?.subtotal ?? 0);
  const shopName = typeof order?.shop === 'object' ? order.shop?.name : 'Local shop';
  const eta = order?.shop?.deliverySettings?.estimatedDeliveryTime || order?.estimatedDeliveryTime || '';

  return {
    orderId: order?._id,
    orderNumber: order?._id ? order._id.slice(-6).toUpperCase() : '',
    shopName: shopName || 'Local shop',
    totalAmount,
    itemCount,
    eta,
    status: normalizeOrderStatus(order?.status),
    updatedAt: order?.updatedAt || order?.createdAt
  };
};
