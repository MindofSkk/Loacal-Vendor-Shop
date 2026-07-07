import { body } from 'express-validator';

export const userStatusValidator = [
  body('status').isIn(['active', 'suspended']).withMessage('Status must be active or suspended')
];
