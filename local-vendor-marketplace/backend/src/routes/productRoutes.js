import { Router } from 'express';
import { MAX_PRODUCT_IMAGES } from '../models/Product.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  listSellerProducts,
  updateProduct
} from '../controllers/productController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createProductValidator, updateProductValidator } from '../validators/productValidators.js';

const router = Router();

router.get('/', listProducts);
router.get('/seller/me', protect, authorize('seller'), listSellerProducts);
router.post(
  '/',
  protect,
  authorize('seller'),
  upload.array('images', MAX_PRODUCT_IMAGES),
  createProductValidator,
  validate,
  createProduct
);
router.get('/:id', getProductById);
router.patch(
  '/:id',
  protect,
  authorize('seller'),
  upload.array('images', MAX_PRODUCT_IMAGES),
  updateProductValidator,
  validate,
  updateProduct
);
router.delete('/:id', protect, authorize('seller'), deleteProduct);

export default router;
