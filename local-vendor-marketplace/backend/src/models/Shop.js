import mongoose from 'mongoose';

export const BUSINESS_TYPES = ['Restaurant', 'Grocery / Kirana Store', 'Dairy and Bakery'];

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
