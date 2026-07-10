import mongoose from 'mongoose';
import { BUSINESS_TYPES } from './Shop.js';

export const FOOD_CATEGORIES = ['Starter', 'Main Course', 'Snacks', 'Drinks', 'Dessert'];
export const GROCERY_CATEGORIES = ['Rice', 'Oil', 'Snacks', 'Cold Drinks', 'Household', 'Personal Care', 'Other'];

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    publicId: String
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    businessType: {
      type: String,
      enum: BUSINESS_TYPES,
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
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      min: 0,
      default: 0
    },
    brand: {
      type: String,
      trim: true
    },
    packSize: {
      type: String,
      trim: true
    },
    vegType: {
      type: String,
      enum: ['Veg', 'Non-Veg']
    },
    foodCategory: {
      type: String,
      enum: FOOD_CATEGORIES
    },
    groceryCategory: {
      type: String,
      enum: GROCERY_CATEGORIES
    },
    dairyBakeryType: {
      type: String,
      enum: ['Dairy', 'Bakery']
    },
    freshStockToday: {
      type: Boolean,
      default: false
    },
    images: [imageSchema],
    isDemoProduct: {
      type: Boolean,
      default: false,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    }
  },
  { timestamps: true }
);

productSchema.virtual('isAvailable').get(function isAvailable() {
  return this.status === 'active' && this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
