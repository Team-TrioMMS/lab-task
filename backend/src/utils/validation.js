import { httpError } from './errors.js';

export function positiveId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw httpError(400, `${field} must be a positive integer`);
  }
  return id;
}

export function parseDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, `${field} must use YYYY-MM-DD format`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw httpError(400, `${field} must be a valid date`);
  }
  return value;
}

export function parseTime(value, field) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw httpError(400, `${field} must use 24-hour HH:MM format`);
  }
  return value;
}

export function parseDuration(value) {
  const duration = Number(value);
  if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
    throw httpError(400, 'durationMinutes must be an integer from 1 to 1440');
  }
  return duration;
}

export function parseUrgency(value) {
  const urgency = value ?? 'low';
  if (!['low', 'medium', 'high'].includes(urgency)) {
    throw httpError(400, 'urgency must be low, medium, or high');
  }
  return urgency;
}
