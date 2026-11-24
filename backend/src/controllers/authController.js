import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { asyncHandler, httpError } from '../utils/errors.js';

const tokenSecret = process.env.JWT_SECRET;

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, tokenSecret, { expiresIn: '8h' });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedName || normalizedName.length > 100) {
    throw httpError(400, 'name is required and must be at most 100 characters');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 150) {
    throw httpError(400, 'A valid email is required');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw httpError(400, 'password must contain 8 to 72 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let result;
  try {
    [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [normalizedName, normalizedEmail, passwordHash],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw httpError(409, 'An account with this email already exists');
    }
    throw error;
  }

  const user = { id: result.insertId, name: normalizedName, email: normalizedEmail, role: 'student' };
  return res.status(201).json({ user, token: createToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;

  if (!email || typeof password !== 'string') {
    throw httpError(400, 'email and password are required');
  }

  const [rows] = await pool.execute(
    'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  const account = rows[0];
  if (!account || !(await bcrypt.compare(password, account.password))) {
    throw httpError(401, 'Invalid email or password');
  }

  const user = { id: account.id, name: account.name, email: account.email, role: account.role };
  return res.json({ user, token: createToken(user) });
});

export const profile = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
    [req.auth.sub],
  );
  if (!rows[0]) {
    throw httpError(401, 'Account no longer exists');
  }
  return res.json({ user: rows[0] });
});
