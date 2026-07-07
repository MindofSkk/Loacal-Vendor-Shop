import { body } from 'express-validator';
import { BUSINESS_TYPES } from '../models/Shop.js';

export const shopValidator = [
  body('name').trim().notEmpty().withMessage('Shop name is required'),
  body('description').optional().trim(),
  body('category').optional().isMongoId().withMessage('Invalid category id'),
  body('businessType').isIn(BUSINESS_TYPES).withMessage('Business type is required'),
  body('phone').trim().notEmpty().withMessage('Shop phone is required'),
  body('location.area').trim().notEmpty().withMessage('Area is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.pincode').trim().notEmpty().withMessage('Pincode is required'),
  body('deliveryRadiusKm').optional().isFloat({ min: 1, max: 25 }).withMessage('Delivery radius must be 1-25 km'),
  body('deliveryBoys').optional().isArray().withMessage('Delivery boys must be an array'),
  body('deliveryBoys.*.name').optional().trim(),
  body('deliveryBoys.*.phone').optional().trim()
];

export const shopStatusValidator = [
  body('status').isIn(['pending', 'approved', 'rejected', 'suspended']).withMessage('Invalid shop status'),
  body('rejectionReason').optional().trim()
];
