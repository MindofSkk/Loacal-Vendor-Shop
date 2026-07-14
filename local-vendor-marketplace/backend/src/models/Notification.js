import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      index: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['order', 'shop', 'system'],
      default: 'system'
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    eventKey: {
      type: String,
      index: true
    },
    link: String,
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

notificationSchema.pre('validate', function syncBody(next) {
  if (!this.body && this.message) this.body = this.message;
  if (!this.message && this.body) this.message = this.body;
  next();
});

notificationSchema.index({ user: 1, eventKey: 1 }, { unique: true, partialFilterExpression: { eventKey: { $type: 'string' } } });

export const Notification = mongoose.model('Notification', notificationSchema);
