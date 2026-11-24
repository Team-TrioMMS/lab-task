import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSchedule } from '../src/utils/scheduler.js';

const now = new Date('2026-11-24T08:00:00Z');

function request(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    equipment_id: 1,
    booking_date: '2026-11-25',
    start_time: '10:00',
    duration_minutes: 180,
    deadline: '2026-11-27',
    urgency: 'low',
    created_at: '2026-11-24T08:00:00Z',
    ...overrides,
  };
}

test('places requests in a continuous slot and avoids existing bookings', () => {
  const result = generateSchedule({
    now,
    requests: [request()],
    existingSchedules: [{
      equipment_id: 1,
      starts_at: '2026-11-25 10:00:00',
      ends_at: '2026-11-25 11:00:00',
    }],
  });

  assert.equal(result.scheduled[0].startsAt, '2026-11-25 11:00:00');
  assert.equal(result.scheduled[0].endsAt, '2026-11-25 14:00:00');
});

test('prioritizes urgency and spreads equal-priority work fairly', () => {
  const result = generateSchedule({
    now,
    requests: [
      request({ id: 1, user_id: 1, urgency: 'low', created_at: '2026-11-24T08:00:00Z' }),
      request({ id: 2, user_id: 2, urgency: 'high', created_at: '2026-11-24T09:00:00Z' }),
      request({ id: 3, user_id: 1, urgency: 'high', created_at: '2026-11-24T10:00:00Z' }),
    ],
  });

  assert.deepEqual(result.scheduled.map(({ request: item }) => item.id), [2, 3, 1]);
});

test('alternates same-priority requests when one student has multiple requests', () => {
  const result = generateSchedule({
    now,
    requests: [
      request({ id: 1, user_id: 1, created_at: '2026-11-24T08:00:00Z' }),
      request({ id: 2, user_id: 1, created_at: '2026-11-24T08:01:00Z' }),
      request({ id: 3, user_id: 2, created_at: '2026-11-24T08:02:00Z' }),
    ],
  });

  assert.deepEqual(result.scheduled.map(({ request: item }) => item.id), [1, 3, 2]);
});

test('keeps equipment unavailable during maintenance and respects deadlines', () => {
  const result = generateSchedule({
    now,
    requests: [request()],
    maintenance: [{
      equipment_id: 1,
      start_date: '2026-11-25 09:00:00',
      end_date: '2026-11-26 12:00:00',
    }],
  });

  assert.equal(result.scheduled[0].startsAt, '2026-11-26 12:00:00');
  const impossible = generateSchedule({
    now,
    requests: [request({ deadline: '2026-11-25' })],
    maintenance: [{
      equipment_id: 1,
      start_date: '2026-11-25 09:00:00',
      end_date: '2026-11-26 12:00:00',
    }],
  });
  assert.equal(impossible.unscheduled.length, 1);
});
