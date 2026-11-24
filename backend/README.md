# LabBook API

Express API for student/admin authentication, equipment, booking requests, automatic scheduling, and maintenance.

## Requirements and setup

- Node.js 20 or later
- MySQL 8.0.16 or later

From `backend/`, install dependencies:

```bash
npm install
```

Run `database/schema.sql` in MySQL, copy `backend/.env.example` to `backend/.env`, set the database credentials, and use a random `JWT_SECRET` of at least 32 characters. Start the server from `backend/`:

```bash
npm run dev
```

For an existing database created before the `purpose` field was added, run `database/migrations/001_add_booking_purpose.sql` once. The schema includes the field for new installations.

Public registration always creates a student account. To grant administrator access, register the account first and promote it using a trusted database session:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.edu';
```

Never expose an endpoint that lets an unauthenticated caller choose the `admin` role.

## Scheduling

The admin-only schedule generator ranks requests by urgency, nearest research deadline, and each student's existing allocation count. It allocates continuous intervals, honoring requested date/time, and excludes existing schedule and active-maintenance intervals. Unscheduled requests include a reason (for example, maintenance or no slot before the deadline).

Manual approvals and overrides are checked transactionally against equipment schedules and maintenance; conflicts return HTTP 409 and do not displace another booking. Adding maintenance removes affected slots and reschedules them after the expected repair time when possible. With an unknown end time, affected bookings remain marked for rescheduling until repair timing is available.

Booking times are laboratory-local wall-clock values in `YYYY-MM-DD` and `HH:MM` format. A booking session is continuous and cannot cross midnight.

## API

Protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register a student (`name`, `email`, `password`) |
| POST | `/api/auth/login` | Public | Log in (`email`, `password`) |
| GET | `/api/auth/profile` | Authenticated | Get the current account |
| GET | `/api/equipment` | Public | List equipment |
| GET | `/api/equipment/:id` | Public | Get one equipment item |
| POST | `/api/equipment` | Admin | Add equipment |
| PATCH | `/api/equipment/:id` | Admin | Update equipment fields/status |
| POST | `/api/bookings` | Authenticated | Submit own booking request |
| GET | `/api/bookings/my` | Authenticated | List own requests |
| GET | `/api/bookings/:id` | Owner or admin | Get a request |
| GET | `/api/bookings` | Admin | List all requests |
| POST | `/api/bookings/schedule/generate` | Admin | Generate an optimized schedule |
| PUT | `/api/bookings/:id/status` | Admin | Approve, reject, or manually reschedule |
| DELETE | `/api/bookings/:id` | Owner | Cancel a pending request |
| GET | `/api/maintenance` | Admin | List maintenance records |
| POST | `/api/maintenance` | Admin | Create maintenance and reschedule affected bookings |
| PATCH | `/api/maintenance/:id` | Admin | Mark maintenance complete |
| GET | `/api/notifications` | Authenticated | List own notifications |
| PATCH | `/api/notifications/:id/read` | Owner | Mark a notification read |

Booking request example:

```json
{
  "equipmentId": 1,
  "bookingDate": "2027-01-15",
  "startTime": "09:30",
  "durationMinutes": 180,
  "deadline": "2027-01-20",
  "urgency": "high",
  "purpose": "Research sample imaging"
}
```

To approve at the requested time, send `{"status":"approved"}`. To manually move the booking or change equipment, send `{"status":"rescheduled","scheduledDate":"2027-01-16","scheduledStartTime":"10:00","scheduledEquipmentId":2}`. Conflicting intervals return HTTP 409.

Run the scheduling unit tests from `backend/` with `npm test`.
