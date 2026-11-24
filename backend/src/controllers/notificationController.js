import { pool } from '../config/db.js';
import { asyncHandler, httpError } from '../utils/errors.js';
import { positiveId } from '../utils/validation.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, message, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
    [req.auth.sub],
  );
  return res.json({ notifications: rows });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id, 'notification id');
  const [result] = await pool.execute(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [id, req.auth.sub],
  );
  if (result.affectedRows === 0) {
    const [rows] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ?',
      [id],
    );
    if (!rows[0]) {
      throw httpError(404, 'Notification not found');
    }
    throw httpError(403, 'You are not authorized to update this notification');
  }
  return res.json({ notificationId: id, isRead: true });
});
