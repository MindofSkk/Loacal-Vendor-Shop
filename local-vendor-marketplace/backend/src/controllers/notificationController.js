import { Expo } from 'expo-server-sdk';
import { Notification } from '../models/Notification.js';
import { NotificationToken } from '../models/NotificationToken.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 30)));
  const skip = (page - 1) * limit;
  const [items, unreadCount, total] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
    Notification.countDocuments({ user: req.user._id })
  ]);

  res.json({ items, unreadCount, page, limit, total });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  res.json(notification);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'Notifications marked as read' });
});

export const registerToken = asyncHandler(async (req, res) => {
  const { expoPushToken, platform = 'unknown', deviceId = '', appType } = req.body;
  const appRole = String(appType || '').replace('-web', '');

  if (!Expo.isExpoPushToken(expoPushToken)) {
    throw new ApiError(400, 'Invalid Expo push token');
  }

  if (!['customer', 'seller', 'admin'].includes(appRole) || appRole !== req.user.role) {
    throw new ApiError(403, 'Invalid app type for this account');
  }

  const token = await NotificationToken.findOneAndUpdate(
    { expoPushToken },
    {
      $set: {
        user: req.user._id,
        role: req.user.role,
        expoPushToken,
        platform: ['ios', 'android', 'web'].includes(platform) ? platform : 'unknown',
        deviceId,
        appType,
        active: true,
        lastSeenAt: new Date()
      },
      $setOnInsert: { failureCount: 0 }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ message: 'Notification token registered', tokenId: token._id });
});

export const unregisterToken = asyncHandler(async (req, res) => {
  const { expoPushToken } = req.body;

  if (!expoPushToken) {
    throw new ApiError(400, 'Expo push token is required');
  }

  await NotificationToken.updateOne(
    { expoPushToken, user: req.user._id },
    { active: false, lastSeenAt: new Date() }
  );

  res.json({ message: 'Notification token unregistered' });
});
