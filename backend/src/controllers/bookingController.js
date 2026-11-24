import { pool } from '../config/db.js';
import { asyncHandler, httpError } from '../utils/errors.js';
import {
  parseDate,
  parseDuration,
  parseTime,
  parseUrgency,
  positiveId,
} from '../utils/validation.js';
import { generateSchedule } from '../utils/scheduler.js';

const bookingSelect = `
  SELECT b.id, b.user_id, u.name AS user_name, b.equipment_id, e.name AS equipment_name,
         b.booking_date, b.start_time, b.duration_minutes, b.deadline, b.urgency, b.purpose, b.status,
         b.created_at, s.starts_at AS scheduled_start, s.ends_at AS scheduled_end
  FROM booking_requests b
  JOIN users u ON u.id = b.user_id
  JOIN equipment e ON e.id = b.equipment_id
  LEFT JOIN schedules s ON s.booking_id = b.id
`;

function localDateTime(date, time) {
  return `${date} ${time}:00`;
}

async function ensureSlotAvailable(connection, equipmentId, startAt, durationMinutes, excludeBookingId) {
  const [equipmentRows] = await connection.execute(
    'SELECT id, status FROM equipment WHERE id = ? FOR UPDATE',
    [equipmentId],
  );
  if (!equipmentRows[0]) {
    throw httpError(404, 'Equipment not found');
  }
  if (equipmentRows[0].status === 'maintenance') {
    throw httpError(409, 'Equipment is under maintenance');
  }

  const [scheduleRows] = await connection.execute(
    `SELECT id FROM schedules
     WHERE equipment_id = ?
       AND starts_at < TIMESTAMPADD(MINUTE, ?, ?)
       AND ends_at > ?
       AND (? IS NULL OR booking_id <> ?)
     LIMIT 1`,
    [equipmentId, durationMinutes, startAt, startAt, excludeBookingId ?? null, excludeBookingId ?? null],
  );
  if (scheduleRows.length > 0) {
    throw httpError(409, 'The requested time conflicts with an existing booking');
  }

  const [maintenanceRows] = await connection.execute(
    `SELECT id FROM maintenance
     WHERE equipment_id = ? AND status = 'active'
       AND start_date < TIMESTAMPADD(MINUTE, ?, ?)
       AND (end_date IS NULL OR end_date > ?)
     LIMIT 1`,
    [equipmentId, durationMinutes, startAt, startAt],
  );
  if (maintenanceRows.length > 0) {
    throw httpError(409, 'The requested time overlaps equipment maintenance');
  }
}

export const createBooking = asyncHandler(async (req, res) => {
  const equipmentId = positiveId(req.body?.equipmentId, 'equipmentId');
  const bookingDate = parseDate(req.body?.bookingDate ?? req.body?.date, 'bookingDate');
  const startTime = parseTime(req.body?.startTime, 'startTime');
  const durationMinutes = parseDuration(req.body?.durationMinutes);
  const deadline = req.body?.deadline == null || req.body.deadline === ''
    ? null
    : parseDate(req.body.deadline, 'deadline');
  const urgency = parseUrgency(req.body?.urgency);
  const purpose = req.body?.purpose == null ? null : String(req.body.purpose).trim();
  if (purpose && purpose.length > 500) {
    throw httpError(400, 'purpose must be at most 500 characters');
  }
  if (deadline && deadline < bookingDate) {
    throw httpError(400, 'deadline cannot be before bookingDate');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const startAt = localDateTime(bookingDate, startTime);
    await ensureSlotAvailable(connection, equipmentId, startAt, durationMinutes);
    const [result] = await connection.execute(
      `INSERT INTO booking_requests
       (user_id, equipment_id, booking_date, start_time, duration_minutes, deadline, urgency, purpose)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.auth.sub, equipmentId, bookingDate, `${startTime}:00`, durationMinutes, deadline, urgency, purpose],
    );
    await connection.commit();
    return res.status(201).json({
      booking: {
        id: result.insertId,
        equipmentId,
        bookingDate,
        startTime,
        durationMinutes,
        deadline,
        urgency,
        purpose,
        status: 'pending',
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const listBookings = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`${bookingSelect} ORDER BY b.created_at DESC`);
  return res.json({ bookings: rows });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `${bookingSelect} WHERE b.user_id = ? ORDER BY b.created_at DESC`,
    [req.auth.sub],
  );
  return res.json({ bookings: rows });
});

export const getBooking = asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id, 'booking id');
  const [rows] = await pool.execute(`${bookingSelect} WHERE b.id = ? LIMIT 1`, [id]);
  const booking = rows[0];
  if (!booking) {
    throw httpError(404, 'Booking not found');
  }
  if (req.auth.role !== 'admin' && booking.user_id !== req.auth.sub) {
    throw httpError(403, 'You are not authorized to view this booking');
  }
  return res.json({ booking });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id, 'booking id');
  const { status } = req.body ?? {};
  if (!['approved', 'rejected', 'rescheduled'].includes(status)) {
    throw httpError(400, 'status must be approved, rejected, or rescheduled');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [bookingRows] = await connection.execute(
      `SELECT b.id, b.user_id, b.equipment_id, b.booking_date, b.start_time,
              b.duration_minutes, b.status
       FROM booking_requests b WHERE b.id = ? FOR UPDATE`,
      [id],
    );
    const booking = bookingRows[0];
    if (!booking) {
      throw httpError(404, 'Booking not found');
    }
    if (['cancelled', 'rejected'].includes(booking.status)) {
      throw httpError(409, `A ${booking.status} booking cannot be scheduled`);
    }

    let startAt;
    let equipmentId = booking.equipment_id;
    if (req.body?.scheduledEquipmentId !== undefined) {
      equipmentId = positiveId(req.body.scheduledEquipmentId, 'scheduledEquipmentId');
    }
    if (status === 'rescheduled' || req.body?.scheduledDate !== undefined || req.body?.scheduledStartTime !== undefined) {
      if (!req.body?.scheduledDate || !req.body?.scheduledStartTime) {
        throw httpError(400, 'scheduledDate and scheduledStartTime must be provided together');
      }
      const scheduledDate = parseDate(req.body.scheduledDate, 'scheduledDate');
      const scheduledTime = parseTime(req.body.scheduledStartTime, 'scheduledStartTime');
      startAt = localDateTime(scheduledDate, scheduledTime);
    } else {
      startAt = localDateTime(booking.booking_date, booking.start_time.slice(0, 5));
    }

    if (status === 'approved' || status === 'rescheduled') {
      await ensureSlotAvailable(connection, equipmentId, startAt, booking.duration_minutes, id);
      await connection.execute(
        `INSERT INTO schedules (booking_id, equipment_id, starts_at, ends_at)
         VALUES (?, ?, ?, TIMESTAMPADD(MINUTE, ?, ?))
         ON DUPLICATE KEY UPDATE equipment_id = VALUES(equipment_id),
                                 starts_at = VALUES(starts_at),
                                 ends_at = VALUES(ends_at)`,
        [id, equipmentId, startAt, booking.duration_minutes, startAt],
      );
      if (equipmentId !== booking.equipment_id) {
        await connection.execute('UPDATE booking_requests SET equipment_id = ? WHERE id = ?', [equipmentId, id]);
      }
    } else {
      await connection.execute('DELETE FROM schedules WHERE booking_id = ?', [id]);
    }

    await connection.execute('UPDATE booking_requests SET status = ? WHERE id = ?', [status, id]);
    const message = status === 'approved'
      ? 'Your equipment booking has been approved.'
      : status === 'rejected'
        ? 'Your equipment booking request was rejected.'
        : 'Your equipment booking has been rescheduled.';
    await connection.execute(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [booking.user_id, message],
    );
    await connection.commit();
    return res.json({ bookingId: id, status, scheduledStart: startAt });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const generateBookingsSchedule = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [requests] = await connection.execute(
      `SELECT b.id, b.user_id, b.equipment_id, b.booking_date, b.start_time,
              b.duration_minutes, b.deadline, b.urgency, b.created_at
       FROM booking_requests b
      WHERE b.status IN ('pending', 'rescheduled')
        AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.booking_id = b.id)
       ORDER BY b.created_at
       FOR UPDATE`,
    );
    if (requests.length === 0) {
      await connection.commit();
      return res.json({ scheduled: [], unscheduled: [] });
    }

    const equipmentIds = [...new Set(requests.map((request) => request.equipment_id))];
    const [equipmentRows] = await connection.execute(
      `SELECT id, status FROM equipment
       WHERE id IN (${equipmentIds.map(() => '?').join(',')})
       ORDER BY id FOR UPDATE`,
      equipmentIds,
    );
    const unavailableEquipment = new Set(
      equipmentRows.filter((equipment) => equipment.status === 'maintenance').map((equipment) => equipment.id),
    );
    const readyRequests = requests.filter((request) => !unavailableEquipment.has(request.equipment_id));
    const [existingSchedules] = await connection.execute(
      `SELECT s.equipment_id,
              DATE_FORMAT(s.starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at,
              DATE_FORMAT(s.ends_at, '%Y-%m-%d %H:%i:%s') AS ends_at,
              b.user_id
       FROM schedules s JOIN booking_requests b ON b.id = s.booking_id
       WHERE s.ends_at >= CURRENT_TIMESTAMP`,
    );
    const [maintenance] = await connection.execute(
      `SELECT equipment_id,
              DATE_FORMAT(start_date, '%Y-%m-%d %H:%i:%s') AS start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d %H:%i:%s') AS end_date
       FROM maintenance WHERE status = 'active'`,
    );
    const result = generateSchedule({
      requests: readyRequests,
      existingSchedules,
      maintenance,
    });
    for (const item of result.scheduled) {
      await connection.execute(
        `INSERT INTO schedules (booking_id, equipment_id, starts_at, ends_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE equipment_id = VALUES(equipment_id),
                                 starts_at = VALUES(starts_at),
                                 ends_at = VALUES(ends_at)`,
        [item.request.id, item.request.equipment_id, item.startsAt, item.endsAt],
      );
      await connection.execute(
        "UPDATE booking_requests SET status = 'approved' WHERE id = ?",
        [item.request.id],
      );
      await connection.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [item.request.user_id, `Your booking has been scheduled for ${item.startsAt}.`],
      );
    }
    const unscheduled = [
      ...result.unscheduled,
      ...requests
        .filter((request) => unavailableEquipment.has(request.equipment_id))
        .map((request) => ({ request, reason: 'Equipment is under maintenance.' })),
    ];
    await connection.commit();
    return res.json({
      scheduled: result.scheduled.map(({ request, startsAt, endsAt }) => ({
        bookingId: request.id,
        startsAt,
        endsAt,
      })),
      unscheduled: unscheduled.map(({ request, reason }) => ({ bookingId: request.id, reason })),
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id, 'booking id');
  const [result] = await pool.execute(
    `UPDATE booking_requests
     SET status = 'cancelled'
     WHERE id = ? AND user_id = ? AND status = 'pending'`,
    [id, req.auth.sub],
  );
  if (result.affectedRows === 0) {
    const [rows] = await pool.execute(
      'SELECT id, user_id, status FROM booking_requests WHERE id = ?',
      [id],
    );
    if (!rows[0]) {
      throw httpError(404, 'Booking not found');
    }
    if (rows[0].user_id !== req.auth.sub) {
      throw httpError(403, 'You are not authorized to cancel this booking');
    }
    throw httpError(409, 'Only pending bookings can be cancelled');
  }
  return res.json({ bookingId: id, status: 'cancelled' });
});
