import { Router } from 'express';
import {
  adminListShops,
  createOrUpdateMyShop,
  getMyShop,
  getMyShopSettings,
  getShopById,
  listShops,
  updateMyShopSettings,
  updateShopStatus
} from '../controllers/shopController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { shopSettingsValidator, shopStatusValidator, shopValidator } from '../validators/shopValidators.js';

const router = Router();

router.get('/', listShops);
router.get('/admin/all', protect, authorize('admin'), adminListShops);
router.get('/seller/me', protect, authorize('seller'), getMyShop);
router.post('/seller/me', protect, authorize('seller'), shopValidator, validate, createOrUpdateMyShop);
router.get('/seller/settings', protect, authorize('seller'), getMyShopSettings);
router.patch('/seller/settings', protect, authorize('seller'), shopSettingsValidator, validate, updateMyShopSettings);
router.patch('/admin/:id/status', protect, authorize('admin'), shopStatusValidator, validate, updateShopStatus);
router.get('/:id', getShopById);

export default router;
