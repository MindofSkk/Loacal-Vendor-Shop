import { body } from 'express-validator';
import { BUSINESS_TYPES, CLOSURE_REASONS, WEEK_DAYS } from '../models/Shop.js';

export const shopValidator = [
  body('name').trim().notEmpty().withMessage('Shop name is required'),
  body('description').optional().trim(),
  body('logoUrl').optional().trim(),
  body('category').optional().isMongoId().withMessage('Invalid category id'),
  body('businessType').isIn(BUSINESS_TYPES).withMessage('Business type is required'),
  body('phone').trim().notEmpty().withMessage('Shop phone is required'),
  body('location.area').trim().notEmpty().withMessage('Area is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.pincode').trim().notEmpty().withMessage('Pincode is required'),
  body('location.latitude').optional({ nullable: true }).isFloat().withMessage('Latitude must be a number'),
  body('location.longitude').optional({ nullable: true }).isFloat().withMessage('Longitude must be a number'),
  body('location.mapUrl').optional().trim(),
  body('deliveryRadiusKm').optional().isFloat({ min: 1, max: 25 }).withMessage('Delivery radius must be 1-25 km'),
  body('deliveryBoys').optional().isArray().withMessage('Delivery boys must be an array'),
  body('deliveryBoys.*.name').optional().trim(),
  body('deliveryBoys.*.phone').optional().trim()
];

export const shopStatusValidator = [
  body('status').isIn(['pending', 'approved', 'rejected', 'suspended']).withMessage('Invalid shop status'),
  body('rejectionReason').optional().trim()
];

export const shopSettingsValidator = [
  body('workingHours').isArray({ min: 7, max: 7 }).withMessage('Working hours must include all 7 days'),
  body('workingHours.*.day').isIn(WEEK_DAYS).withMessage('Invalid day'),
  body('workingHours.*.openTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Open time must be HH:mm'),
  body('workingHours.*.closeTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Close time must be HH:mm'),
  body('workingHours.*.closed').isBoolean().withMessage('Closed must be true or false'),
  body('temporaryClosure.enabled').optional().isBoolean().withMessage('Temporary closure must be true or false'),
  body('temporaryClosure.reason').optional().isIn(CLOSURE_REASONS).withMessage('Invalid closure reason'),
  body('temporaryClosure.customReason').optional().trim(),
  body('deliverySettings.radiusKm').isFloat({ gt: 0 }).withMessage('Radius must be greater than 0'),
  body('deliverySettings.minimumOrder').isFloat({ min: 0 }).withMessage('Minimum order must be zero or more'),
  body('deliverySettings.deliveryCharge').isFloat({ min: 0 }).withMessage('Delivery charge must be zero or more'),
  body('deliverySettings.freeDeliveryAbove').isFloat({ min: 0 }).withMessage('Free delivery amount must be zero or more'),
  body('deliverySettings.estimatedDeliveryTime').trim().notEmpty().withMessage('ETA is required')
];
