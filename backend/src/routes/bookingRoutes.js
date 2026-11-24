import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getBooking,
  listBookings,
  listMyBookings,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.post('/', createBooking);
router.get('/my', listMyBookings);
router.get('/', requireRole('admin'), listBookings);
router.get('/:id', getBooking);
router.put('/:id/status', requireRole('admin'), updateBookingStatus);
router.delete('/:id', cancelBooking);

export default router;
