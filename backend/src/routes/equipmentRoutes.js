import { Router } from 'express';
import {
  createEquipment,
  getEquipment,
  listEquipment,
  updateEquipment,
} from '../controllers/equipmentController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', listEquipment);
router.get('/:id', getEquipment);
router.post('/', requireAuth, requireRole('admin'), createEquipment);
router.patch('/:id', requireAuth, requireRole('admin'), updateEquipment);

export default router;
