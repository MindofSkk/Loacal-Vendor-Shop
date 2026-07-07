import { body } from 'express-validator';
import { ORDER_STATUSES } from '../models/Order.js';

export const createOrderValidator = [
  body('items').isArray({ min: 1 }).withMessage('Order needs at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product id'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress.fullAddress').trim().notEmpty().withMessage('Full address is required'),
  body('deliveryAddress.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('deliveryAddress.landmark').optional().trim(),
  body('deliveryAddress.latitude').optional({ nullable: true }).isFloat().withMessage('Latitude must be a number'),
  body('deliveryAddress.longitude').optional({ nullable: true }).isFloat().withMessage('Longitude must be a number'),
  body('notes').optional().trim()
];

export const orderStatusValidator = [
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
  body('note').optional().trim()
];

export const cancelOrderValidator = [body('reason').optional().trim()];
