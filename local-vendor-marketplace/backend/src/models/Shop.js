import mongoose from 'mongoose';

export const BUSINESS_TYPES = ['Restaurant', 'Grocery / Kirana Store', 'Dairy and Bakery'];
export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const CLOSURE_REASONS = ['Holiday', 'Out of Stock', 'Personal Reason', 'Maintenance', 'Custom'];

const locationSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    landmark: {
      type: String,
      trim: true
    },
    latitude: Number,
    longitude: Number
  },
  { _id: false }
);

const workingHourSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: WEEK_DAYS,
      required: true
    },
    openTime: {
      type: String,
      default: '09:00'
    },
    closeTime: {
      type: String,
      default: '21:00'
    },
    closed: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const deliverySettingsSchema = new mongoose.Schema(
  {
    radiusKm: {
      type: Number,
      default: 5,
      min: 0.1
    },
    minimumOrder: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    freeDeliveryAbove: {
      type: Number,
      default: 0,
      min: 0
    },
    estimatedDeliveryTime: {
      type: String,
      default: '30 Minutes',
      trim: true
    }
  },
  { _id: false }
);

const temporaryClosureSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      enum: CLOSURE_REASONS,
      default: 'Holiday'
    },
    customReason: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    logoUrl: {
      type: String,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    businessType: {
      type: String,
      enum: BUSINESS_TYPES,
      required: true,
      default: 'Restaurant',
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: locationSchema,
      required: true
    },
    deliveryRadiusKm: {
      type: Number,
      default: 5,
      min: 1,
      max: 25
    },
    workingHours: {
      type: [workingHourSchema],
      default: () => WEEK_DAYS.map((day) => ({ day }))
    },
    deliverySettings: {
      type: deliverySettingsSchema,
      default: () => ({})
    },
    temporaryClosure: {
      type: temporaryClosureSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true
    },
    rejectionReason: String,
    isOpen: {
      type: Boolean,
      default: true
    },
    deliveryBoys: [
      {
        name: {
          type: String,
          trim: true
        },
        phone: {
          type: String,
          trim: true
        }
      }
    ]
  },
  { timestamps: true }
);

shopSchema.index({ name: 'text', description: 'text', 'location.area': 'text', 'location.city': 'text' });

export const Shop = mongoose.model('Shop', shopSchema);
