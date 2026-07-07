import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory
} from '../controllers/categoryController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { categoryValidator } from '../validators/categoryValidators.js';

const router = Router();

router.get('/', listCategories);
router.post('/', protect, authorize('admin'), categoryValidator, validate, createCategory);
router.patch('/:id', protect, authorize('admin'), categoryValidator, validate, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
