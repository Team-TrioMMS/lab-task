import { pool } from '../config/db.js';
import { asyncHandler, httpError } from '../utils/errors.js';
import { generateSchedule } from '../utils/scheduler.js';
import { parseDate, parseTime, positiveId } from '../utils/validation.js';

function parseDateTime(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw httpError(400, `${field} must use YYYY-MM-DDTHH:MM format`);
  }
  const [date, time] = value.split('T');
  return `${parseDate(date, field)} ${parseTime(time, field)}:00`;
}

function dateTimeParts(value) {
  const [date, time] = value.split(' ');
  return { date, time: time.slice(0, 5) };
}

export const listMaintenance = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT m.id, m.equipment_id, e.name AS equipment_name, m.reason,
            DATE_FORMAT(m.start_date, '%Y-%m-%d %H:%i:%s') AS start_date,
            DATE_FORMAT(m.end_date, '%Y-%m-%d %H:%i:%s') AS end_date,
            m.status
     FROM maintenance m JOIN equipment e ON e.id = m.equipment_id
     ORDER BY m.start_date DESC`,
  );
  return res.json({ maintenance: rows });
});

export const createMaintenance = asyncHandler(async (req, res) => {
  const equipmentId = positiveId(req.body?.equipmentId, 'equipmentId');
  const startDate = parseDateTime(req.body?.startDateTime, 'startDateTime');
  const endDate = req.body?.endDateTime ? parseDateTime(req.body.endDateTime, 'endDateTime') : null;
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!reason || reason.length > 500) {
    throw httpError(400, 'A reason of at most 500 characters is required');
  }
  if (endDate && endDate <= startDate) {
    throw httpError(400, 'endDateTime must be later than startDateTime');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [equipmentRows] = await connection.execute(
      'SELECT id FROM equipment WHERE id = ? FOR UPDATE',
      [equipmentId],
    );
    if (!equipmentRows[0]) {
      throw httpError(404, 'Equipment not found');
    }

    const [overlaps] = await connection.execute(
      `SELECT id FROM maintenance
       WHERE equipment_id = ? AND status = 'active'
         AND (? IS NULL OR start_date < ?)
         AND (end_date IS NULL OR end_date > ?)
       LIMIT 1`,
      [equipmentId, endDate, endDate, startDate],
    );
    if (overlaps.length) {
      throw httpError(409, 'This maintenance interval overlaps existing active maintenance');
    }

    const [result] = await connection.execute(
      `INSERT INTO maintenance (equipment_id, reason, start_date, end_date)
       VALUES (?, ?, ?, ?)`,
      [equipmentId, reason, startDate, endDate],
    );
    const [affectedBookings] = await connection.execute(
      `SELECT b.id, b.user_id, b.equipment_id, b.booking_date, b.start_time,
              b.duration_minutes, b.deadline, b.urgency, b.created_at
       FROM schedules s JOIN booking_requests b ON b.id = s.booking_id
       WHERE s.equipment_id = ?
         AND s.starts_at < COALESCE(?, '9999-12-31 23:59:59')
         AND s.ends_at > ?
       FOR UPDATE`,
      [equipmentId, endDate, startDate],
    );

    if (affectedBookings.length) {
      await connection.execute(
        `DELETE FROM schedules WHERE booking_id IN (${affectedBookings.map(() => '?').join(',')})`,
        affectedBookings.map((booking) => booking.id),
      );
      await connection.execute(
        `UPDATE booking_requests SET status = 'rescheduled'
         WHERE id IN (${affectedBookings.map(() => '?').join(',')})`,
        affectedBookings.map((booking) => booking.id),
      );

      if (endDate) {
        const repair = dateTimeParts(endDate);
        const requests = affectedBookings.map((booking) => ({
          ...booking,
          booking_date: repair.date,
          start_time: repair.time,
        }));
        const [existingSchedules] = await connection.execute(
          `SELECT s.equipment_id,
                  DATE_FORMAT(s.starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at,
                  DATE_FORMAT(s.ends_at, '%Y-%m-%d %H:%i:%s') AS ends_at,
                  b.user_id
           FROM schedules s JOIN booking_requests b ON b.id = s.booking_id
           WHERE s.ends_at >= CURRENT_TIMESTAMP`,
        );
        const [maintenanceRows] = await connection.execute(
          `SELECT equipment_id,
                  DATE_FORMAT(start_date, '%Y-%m-%d %H:%i:%s') AS start_date,
                  DATE_FORMAT(end_date, '%Y-%m-%d %H:%i:%s') AS end_date
           FROM maintenance WHERE status = 'active'`,
        );
        const { scheduled, unscheduled } = generateSchedule({
          requests,
          existingSchedules,
          maintenance: maintenanceRows,
        });
        for (const item of scheduled) {
          await connection.execute(
            `INSERT INTO schedules (booking_id, equipment_id, starts_at, ends_at)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE equipment_id = VALUES(equipment_id),
                                     starts_at = VALUES(starts_at),
                                     ends_at = VALUES(ends_at)`,
            [item.request.id, item.request.equipment_id, item.startsAt, item.endsAt],
          );
          await connection.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [item.request.user_id, `Your booking was rescheduled to ${item.startsAt} because of equipment maintenance.`],
          );
        }
        for (const item of unscheduled) {
          await connection.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [item.request.user_id, `Your booking needs a new time because of equipment maintenance: ${item.reason}`],
          );
        }
      } else {
        for (const booking of affectedBookings) {
          await connection.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [booking.user_id, 'Your booking is waiting to be rescheduled because equipment maintenance has no end date yet.'],
          );
        }
      }
    }

    await connection.execute(
      `UPDATE equipment SET status = CASE
         WHEN ? <= CURRENT_TIMESTAMP THEN 'maintenance' ELSE status END
       WHERE id = ?`,
      [startDate, equipmentId],
    );
    await connection.commit();
    return res.status(201).json({
      maintenance: {
        id: result.insertId,
        equipmentId,
        reason,
        startDate,
        endDate,
        status: 'active',
      },
      rescheduledBookings: affectedBookings.length,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const completeMaintenance = asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id, 'maintenance id');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT equipment_id, status FROM maintenance WHERE id = ? FOR UPDATE',
      [id],
    );
    if (!rows[0]) {
      throw httpError(404, 'Maintenance record not found');
    }
    await connection.execute(
      "UPDATE maintenance SET status = 'completed', end_date = COALESCE(end_date, CURRENT_TIMESTAMP) WHERE id = ?",
      [id],
    );
    const [activeRows] = await connection.execute(
      "SELECT id FROM maintenance WHERE equipment_id = ? AND status = 'active' AND id <> ?",
      [rows[0].equipment_id, id],
    );
    if (!activeRows.length) {
      await connection.execute(
        "UPDATE equipment SET status = 'available' WHERE id = ?",
        [rows[0].equipment_id],
      );
    }
    await connection.commit();
    return res.json({ id, status: 'completed' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
