const URGENCY_RANK = { high: 3, medium: 2, low: 1 };
const SLOT_STEP_MINUTES = 15;
const MINUTES_PER_DAY = 24 * 60;

function datePart(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function timePart(value) {
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
  return String(value).slice(0, 5);
}

function toMinutes(date, time = '00:00') {
  const [year, month, day] = datePart(date).split('-').map(Number);
  const [hour, minute] = timePart(time).split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 60000;
}

function dateTimeMinutes(value) {
  if (value instanceof Date) {
    return toMinutes(value.toISOString().slice(0, 10), value.toISOString().slice(11, 16));
  }
  const [date, time = '00:00'] = String(value).replace('T', ' ').split(' ');
  return toMinutes(date, time);
}

function fromMinutes(minutes) {
  const date = new Date(minutes * 60000);
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
    timestamp: date.toISOString().slice(0, 19).replace('T', ' '),
  };
}

function compareRequests(a, b, fairnessCounts) {
  const urgencyDifference = (URGENCY_RANK[b.urgency] ?? 1) - (URGENCY_RANK[a.urgency] ?? 1);
  if (urgencyDifference) return urgencyDifference;

  const aDeadline = a.deadline ? datePart(a.deadline) : '9999-12-31';
  const bDeadline = b.deadline ? datePart(b.deadline) : '9999-12-31';
  if (aDeadline !== bDeadline) return aDeadline.localeCompare(bDeadline);

  const fairnessDifference = (fairnessCounts.get(a.user_id) ?? 0) - (fairnessCounts.get(b.user_id) ?? 0);
  if (fairnessDifference) return fairnessDifference;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function overlaps(start, end, intervals) {
  return intervals.some((interval) => start < interval.end && end > interval.start);
}

export function generateSchedule({
  requests,
  existingSchedules = [],
  maintenance = [],
  horizonDays = 30,
  now = new Date(),
}) {
  const occupied = new Map();
  const fairnessCounts = new Map();
  const addInterval = (equipmentId, start, end) => {
    const intervals = occupied.get(String(equipmentId)) ?? [];
    intervals.push({ start, end });
    occupied.set(String(equipmentId), intervals);
  };

  for (const schedule of existingSchedules) {
    addInterval(
      schedule.equipment_id,
      dateTimeMinutes(schedule.starts_at) * 60000,
      dateTimeMinutes(schedule.ends_at) * 60000,
    );
    if (schedule.user_id != null) {
      fairnessCounts.set(schedule.user_id, (fairnessCounts.get(schedule.user_id) ?? 0) + 1);
    }
  }

  for (const item of maintenance) {
    addInterval(
      item.equipment_id,
      dateTimeMinutes(item.start_date) * 60000,
      item.end_date ? dateTimeMinutes(item.end_date) * 60000 : Number.POSITIVE_INFINITY,
    );
  }

  const remaining = [...requests];
  const scheduled = [];
  const unscheduled = [];
  const nowMinutes = Math.floor(now.getTime() / 60000);

  while (remaining.length) {
    remaining.sort((a, b) => compareRequests(a, b, fairnessCounts));
    const request = remaining.shift();
    const earliest = Math.max(
      toMinutes(request.booking_date, request.start_time),
      nowMinutes,
    );
    const horizonEnd = Math.floor(earliest / MINUTES_PER_DAY) * MINUTES_PER_DAY
      + horizonDays * MINUTES_PER_DAY;
    const deadlineEnd = request.deadline
      ? toMinutes(request.deadline) + MINUTES_PER_DAY
      : horizonEnd;
    const searchEnd = Math.min(
      deadlineEnd,
      horizonEnd,
    );
    const duration = Number(request.duration_minutes);
    let found;

    for (let dayStart = Math.floor(earliest / MINUTES_PER_DAY) * MINUTES_PER_DAY;
      dayStart < searchEnd && !found;
      dayStart += MINUTES_PER_DAY) {
      const startForDay = Math.max(earliest, dayStart);
      const firstCandidate = dayStart === Math.floor(earliest / MINUTES_PER_DAY) * MINUTES_PER_DAY
        ? startForDay
        : Math.max(dayStart, toMinutes(fromMinutes(dayStart).date, request.start_time));
      for (let start = firstCandidate; start + duration <= dayStart + MINUTES_PER_DAY && start + duration <= searchEnd;
        start += SLOT_STEP_MINUTES) {
        const startMs = start * 60000;
        const endMs = (start + duration) * 60000;
        if (!overlaps(startMs, endMs, occupied.get(String(request.equipment_id)) ?? [])) {
          found = { start: startMs, end: endMs };
          break;
        }
      }
    }

    if (!found) {
      unscheduled.push({ request, reason: 'No continuous equipment slot is available before the deadline.' });
      continue;
    }

    addInterval(request.equipment_id, found.start, found.end);
    fairnessCounts.set(request.user_id, (fairnessCounts.get(request.user_id) ?? 0) + 1);
    const startsAt = fromMinutes(found.start);
    const endsAt = fromMinutes(found.end);
    scheduled.push({
      request,
      startsAt: startsAt.timestamp,
      endsAt: endsAt.timestamp,
    });
  }

  return { scheduled, unscheduled };
}
