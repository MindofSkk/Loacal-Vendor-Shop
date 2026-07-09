import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'Pending',
  'Accepted',
  'Packed',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Rejected'
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    fullAddress: {
      type: String,
      required: true
    },
    landmark: String,
    phone: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number,
    mapUrl: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'At least one order item is required']
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI'],
      default: 'COD'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'NOT_REQUIRED'],
      default: 'NOT_REQUIRED'
    },
    notes: String,
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
      index: true
    },
    cancellationReason: String,
    statusHistory: [statusHistorySchema]
  },
  { timestamps: true }
);

orderSchema.pre('save', function addInitialStatus(next) {
  if (this.deliveryAddress?.latitude != null && this.deliveryAddress?.longitude != null) {
    this.deliveryAddress.mapUrl = `https://www.google.com/maps?q=${this.deliveryAddress.latitude},${this.deliveryAddress.longitude}`;
  }

  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.status, updatedBy: this.customer });
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
