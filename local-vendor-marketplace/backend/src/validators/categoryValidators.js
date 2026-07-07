import { body } from 'express-validator';

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false')
];
