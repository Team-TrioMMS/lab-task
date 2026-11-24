import { Router } from 'express';
import {
  completeMaintenance,
  createMaintenance,
  listMaintenance,
} from '../controllers/maintenanceController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', listMaintenance);
router.post('/', createMaintenance);
router.patch('/:id', completeMaintenance);

export default router;
