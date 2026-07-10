import { body } from 'express-validator';
import { FOOD_CATEGORIES, GROCERY_CATEGORIES } from '../models/Product.js';

export const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional().trim(),
  body('category').optional().isMongoId().withMessage('Invalid category id'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be zero or more'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be zero or more'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid product status'),
  body('brand').optional().trim(),
  body('packSize').optional().trim(),
  body('vegType').optional().isIn(['Veg', 'Non-Veg']).withMessage('Veg type must be Veg or Non-Veg'),
  body('foodCategory').optional().isIn(FOOD_CATEGORIES).withMessage('Invalid food category'),
  body('groceryCategory').optional().isIn(GROCERY_CATEGORIES).withMessage('Invalid grocery category'),
  body('dairyBakeryType').optional().isIn(['Dairy', 'Bakery']).withMessage('Type must be Dairy or Bakery'),
  body('freshStockToday').optional().isBoolean().withMessage('Fresh stock must be true or false'),
  body('thumbnailIndex').optional().isInt({ min: 0, max: 2 }).withMessage('Thumbnail must be one of the uploaded images')
];

export const updateProductValidator = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim(),
  body('category').optional().isMongoId().withMessage('Invalid category id'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or more'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be zero or more'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid product status'),
  body('brand').optional().trim(),
  body('packSize').optional().trim(),
  body('vegType').optional().isIn(['Veg', 'Non-Veg']).withMessage('Veg type must be Veg or Non-Veg'),
  body('foodCategory').optional().isIn(FOOD_CATEGORIES).withMessage('Invalid food category'),
  body('groceryCategory').optional().isIn(GROCERY_CATEGORIES).withMessage('Invalid grocery category'),
  body('dairyBakeryType').optional().isIn(['Dairy', 'Bakery']).withMessage('Type must be Dairy or Bakery'),
  body('freshStockToday').optional().isBoolean().withMessage('Fresh stock must be true or false'),
  body('thumbnailIndex').optional().isInt({ min: 0, max: 2 }).withMessage('Thumbnail must be one of the uploaded images')
];
