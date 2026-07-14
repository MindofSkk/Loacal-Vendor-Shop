import { Expo } from 'expo-server-sdk';
import { Notification } from '../models/Notification.js';
import { NotificationToken } from '../models/NotificationToken.js';

const expo = new Expo(process.env.EXPO_ACCESS_TOKEN ? { accessToken: process.env.EXPO_ACCESS_TOKEN } : {});

const safeLog = (message, error) => {
  if (process.env.NODE_ENV === 'test') return;
  const detail = error?.message || error;
  console.warn(`[notifications] ${message}${detail ? `: ${detail}` : ''}`);
};

const shortId = (id) => String(id || '').slice(-6).toUpperCase();
const itemCount = (order) => order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

const getShopName = (order) => order.shop?.name || 'the shop';

export const orderStatusPayload = (order, status) => {
  const shopName = getShopName(order);
  const statusMap = {
    Pending: {
      title: 'Order placed',
      body: `Your order from ${shopName} has been placed.`,
      type: 'ORDER_PLACED'
    },
    Accepted: {
      title: 'Order accepted',
      body: `${shopName} accepted your order.`,
      type: 'ORDER_ACCEPTED'
    },
    Packed: {
      title: 'Order is ready',
      body: 'Your order is packed and ready for delivery.',
      type: 'ORDER_PACKED'
    },
    'Out for Delivery': {
      title: 'Order is on the way',
      body: 'Your order is out for delivery.',
      type: 'ORDER_OUT_FOR_DELIVERY'
    },
    Delivered: {
      title: 'Order delivered',
      body: 'Your order was delivered successfully.',
      type: 'ORDER_DELIVERED'
    },
    Rejected: {
      title: 'Order rejected',
      body: `${shopName} could not accept your order.`,
      type: 'ORDER_REJECTED'
    },
    Cancelled: {
      title: 'Order cancelled',
      body: 'Your order has been cancelled.',
      type: 'ORDER_CANCELLED'
    }
  };

  if (status === 'Accepted') return statusMap.Accepted;
  if (status === 'Packed') return { title: 'Your order is being prepared', body: `${shopName} has started preparing your order.`, type: 'ORDER_PREPARING' };
  return statusMap[status] || statusMap.Pending;
};

export const sellerNewOrderPayload = (order) => ({
  title: 'New order received',
  body: `Order #${shortId(order._id)} - ${itemCount(order)} items - Rs.${order.subtotal}`,
  type: 'NEW_ORDER'
});

export const sellerCancelledPayload = (order) => ({
  title: 'Order cancelled by customer',
  body: `Order #${shortId(order._id)} has been cancelled.`,
  type: 'CUSTOMER_CANCELLED'
});

export const createNotificationRecord = async ({ userId, recipientRole, title, body, type = 'order', data = {}, orderId, eventKey }) => {
  try {
    return await Notification.create({
      user: userId,
      recipientRole,
      title,
      body,
      message: body,
      type,
      data,
      orderId,
      eventKey,
      link: data?.targetScreen || ''
    });
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
};

export const removeInvalidTokens = async (tickets, tokens) => {
  const invalidTokens = [];
  tickets.forEach((ticket, index) => {
    if (ticket.status === 'error' && ['DeviceNotRegistered', 'InvalidCredentials'].includes(ticket.details?.error)) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length) {
    await NotificationToken.updateMany(
      { expoPushToken: { $in: invalidTokens } },
      { active: false, $inc: { failureCount: 1 } }
    );
  }
};

export const sendToTokens = async (tokens, payload) => {
  const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
  if (!validTokens.length) return;

  const messages = validTokens.map((to) => ({
    to,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    priority: payload.priority || 'high',
    channelId: payload.channelId || 'orders'
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      await removeInvalidTokens(tickets, chunk.map((message) => message.to));
    } catch (err) {
      safeLog('push send failed', err);
    }
  }
};

export const sendToUser = async (userId, payload) => {
  const tokens = await NotificationToken.find({ user: userId, active: true }).select('expoPushToken');
  await sendToTokens(tokens.map((token) => token.expoPushToken), payload);
};

export const sendToUsers = async (userIds, payload) => {
  const tokens = await NotificationToken.find({ user: { $in: userIds }, active: true }).select('expoPushToken');
  await sendToTokens(tokens.map((token) => token.expoPushToken), payload);
};

export const notifyUser = async ({ userId, recipientRole, title, body, type = 'order', data = {}, orderId, eventKey, channelId = 'orders' }) => {
  try {
    await createNotificationRecord({ userId, recipientRole, title, body, type, data, orderId, eventKey });
    await sendToUser(userId, { title, body, data, channelId });
  } catch (err) {
    safeLog('notification failed', err);
  }
};

export const sendCustomerOrderNotification = async (order, status) => {
  const payload = orderStatusPayload(order, status);
  await notifyUser({
    userId: order.customer,
    recipientRole: 'customer',
    title: payload.title,
    body: payload.body,
    type: 'order',
    orderId: order._id,
    eventKey: `customer:${order._id}:${status}`,
    channelId: status === 'Out for Delivery' ? 'delivery-updates' : 'orders',
    data: {
      type: payload.type,
      orderId: String(order._id),
      shopId: String(order.shop?._id || order.shop || ''),
      targetScreen: 'OrderDetails',
      role: 'customer',
      status
    }
  });
};

export const sendSellerNewOrderNotification = async (order) => {
  const payload = sellerNewOrderPayload(order);
  await notifyUser({
    userId: order.seller,
    recipientRole: 'seller',
    title: payload.title,
    body: payload.body,
    type: 'order',
    orderId: order._id,
    eventKey: `seller:${order._id}:new`,
    channelId: 'new-orders',
    data: {
      type: payload.type,
      orderId: String(order._id),
      shopId: String(order.shop?._id || order.shop || ''),
      targetScreen: 'SellerOrderDetails',
      role: 'seller',
      status: order.status
    }
  });
};

export const sendSellerCustomerCancelledNotification = async (order) => {
  const payload = sellerCancelledPayload(order);
  await notifyUser({
    userId: order.seller,
    recipientRole: 'seller',
    title: payload.title,
    body: payload.body,
    type: 'order',
    orderId: order._id,
    eventKey: `seller:${order._id}:customer-cancelled`,
    channelId: 'order-actions',
    data: {
      type: payload.type,
      orderId: String(order._id),
      shopId: String(order.shop?._id || order.shop || ''),
      targetScreen: 'SellerOrderDetails',
      role: 'seller',
      status: order.status
    }
  });
};
