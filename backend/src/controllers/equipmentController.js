import { pool } from '../config/db.js';
import { asyncHandler, httpError } from '../utils/errors.js';
import { positiveId } from '../utils/validation.js';

export const listEquipment = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, description, status, created_at FROM equipment ORDER BY name',
  );
  return res.json({ equipment: rows });
});

export const getEquipment = asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id, 'equipment id');
  const [rows] = await pool.execute(
    'SELECT id, name, description, status, created_at FROM equipment WHERE id = ?',
    [id],
  );
  if (!rows[0]) {
    throw httpError(404, 'Equipment not found');
  }
  return res.json({ equipment: rows[0] });
});

export const createEquipment = asyncHandler(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const description = req.body?.description ?? null;
  if (!name || name.length > 100 || (description !== null && typeof description !== 'string')) {
    throw httpError(400, 'A name (max 100 characters) and optional description are required');
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO equipment (name, description) VALUES (?, ?)',
      [name, description],
    );
    return res.status(201).json({
      equipment: { id: result.insertId, name, description, status: 'available' },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw httpError(409, 'Equipment with this name already exists');
    }
    throw error;
  }
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const id = positiveId(req.params.id, 'equipment id');
  const { name, description, status } = req.body ?? {};
  const updates = [];
  const values = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      throw httpError(400, 'name must be a non-empty string of at most 100 characters');
    }
    updates.push('name = ?');
    values.push(name.trim());
  }
  if (description !== undefined) {
    if (description !== null && typeof description !== 'string') {
      throw httpError(400, 'description must be a string or null');
    }
    updates.push('description = ?');
    values.push(description);
  }
  if (status !== undefined) {
    if (!['available', 'in_use', 'maintenance'].includes(status)) {
      throw httpError(400, 'status must be available, in_use, or maintenance');
    }
    updates.push('status = ?');
    values.push(status);
  }
  if (updates.length === 0) {
    throw httpError(400, 'At least one of name, description, or status is required');
  }

  values.push(id);
  try {
    const [result] = await pool.execute(
      `UPDATE equipment SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      const [existingRows] = await pool.execute('SELECT id FROM equipment WHERE id = ?', [id]);
      if (!existingRows[0]) {
        throw httpError(404, 'Equipment not found');
      }
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw httpError(409, 'Equipment with this name already exists');
    }
    throw error;
  }

  const [rows] = await pool.execute(
    'SELECT id, name, description, status, created_at FROM equipment WHERE id = ?',
    [id],
  );
  return res.json({ equipment: rows[0] });
});
