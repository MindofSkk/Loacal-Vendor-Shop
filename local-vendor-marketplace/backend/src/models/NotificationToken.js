import mongoose from 'mongoose';

const notificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      required: true,
      index: true
    },
    expoPushToken: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web', 'unknown'],
      default: 'unknown'
    },
    deviceId: {
      type: String,
      trim: true
    },
    appType: {
      type: String,
      enum: ['customer', 'seller', 'admin', 'customer-web', 'seller-web', 'admin-web'],
      required: true,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    },
    failureCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

notificationTokenSchema.index({ user: 1, appType: 1, deviceId: 1 });

export const NotificationToken = mongoose.model('NotificationToken', notificationTokenSchema);
