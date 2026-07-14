import { Router } from 'express';
import {
  cancelMyOrder,
  createOrder,
  getMyOrder,
  listMyActiveOrders,
  listAllOrders,
  listMyOrders,
  listSellerOrders,
  updateSellerOrderStatus
} from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  cancelOrderValidator,
  createOrderValidator,
  orderStatusValidator
} from '../validators/orderValidators.js';

const router = Router();

router.use(protect);

router.post('/', authorize('customer'), createOrderValidator, validate, createOrder);
router.get('/my', authorize('customer'), listMyOrders);
router.get('/customer/active', authorize('customer'), listMyActiveOrders);
router.patch('/:id/cancel', authorize('customer'), cancelOrderValidator, validate, cancelMyOrder);
router.get('/seller', authorize('seller'), listSellerOrders);
router.patch('/seller/:id/status', authorize('seller'), orderStatusValidator, validate, updateSellerOrderStatus);
router.get('/admin/all', authorize('admin'), listAllOrders);
router.get('/:id', authorize('customer'), getMyOrder);

export default router;
