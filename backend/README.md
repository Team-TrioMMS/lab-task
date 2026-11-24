# Backend module

Express API for student/admin authentication, equipment, booking requests, and notifications. The scheduling engine and admin UI are separate project modules; this API stores approved schedule slots and rejects overlaps.

## Requirements

- Node.js 20 or later
- MySQL 8.0.16 or later

## Setup

From `backend/`:

```bash
npm install
```

Create the database and tables by running `database/schema.sql` in MySQL Workbench or with the MySQL command-line client. Copy `.env.example` to `.env`, set the database credentials, and replace `JWT_SECRET` with a random secret of at least 32 characters.

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default. `FRONTEND_ORIGIN` may contain a comma-separated allowlist of frontend origins. Do not commit `.env`.

Public registration always creates a student account. To grant administrator access, first register the administrator account, then promote that account using a trusted database session:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.edu';
```

Never expose an endpoint that lets an unauthenticated caller choose the `admin` role.

Booking times are laboratory-local wall-clock times in `YYYY-MM-DD` and `HH:MM` format. `durationMinutes` is a continuous duration from 1 to 1440 minutes. Schedule approval is serialized on the equipment row and checks both existing schedules and active maintenance intervals before writing the schedule.

## API

All responses use JSON. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register a student (`name`, `email`, `password`) |
| POST | `/api/auth/login` | Public | Log in (`email`, `password`) |
| GET | `/api/auth/profile` | Authenticated | Get the current account |
| GET | `/api/equipment` | Public | List equipment |
| GET | `/api/equipment/:id` | Public | Get one equipment item |
| POST | `/api/equipment` | Admin | Add equipment (`name`, optional `description`) |
| PATCH | `/api/equipment/:id` | Admin | Update equipment fields |
| POST | `/api/bookings` | Authenticated | Submit own booking request |
| GET | `/api/bookings/my` | Authenticated | List own requests |
| GET | `/api/bookings/:id` | Owner or admin | Get a request |
| GET | `/api/bookings` | Admin | List all requests |
| PUT | `/api/bookings/:id/status` | Admin | Approve, reject, or reschedule |
| DELETE | `/api/bookings/:id` | Owner | Cancel a pending request |
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
  "urgency": "high"
}
```

To approve at the requested time, send `{"status":"approved"}`. To move it, send `{"status":"rescheduled","scheduledDate":"2027-01-16","scheduledStartTime":"10:00"}`. Reject with `{"status":"rejected"}`. Conflicting intervals return HTTP 409. The administrator must have a valid admin account as described above.

## Integration boundary

This module provides the database and API foundation for the scheduling/admin module. It does not implement automatic priority optimization, maintenance-triggered rescheduling, email delivery, or the React application; those behaviors belong to the agreed scheduling or frontend module and can build on these tables and endpoints.
