import jwt from 'jsonwebtoken';
import { httpError } from '../utils/errors.js';

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters');
}

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(httpError(401, 'Authentication required'));
  }

  try {
    req.auth = jwt.verify(authorization.slice(7), secret);
    return next();
  } catch {
    return next(httpError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(httpError(403, 'You are not authorized to perform this action'));
    }
    return next();
  };
}
