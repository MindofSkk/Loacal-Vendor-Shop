import { Router } from 'express';
import { listUsers, updateUserStatus } from '../controllers/userController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { userStatusValidator } from '../validators/userValidators.js';

const router = Router();

router.use(protect, authorize('admin'));
router.get('/', listUsers);
router.patch('/:id/status', userStatusValidator, validate, updateUserStatus);

export default router;
