# LabBook — Laboratory Equipment Booking

LabBook provides a student booking portal and an admin dashboard for equipment scheduling, request approval, manual schedule changes, and maintenance.

## Stack

- React + Vite, React Router, Bootstrap 5
- Express API with MySQL
- Browser localStorage for student-only demo mode

## Frontend

```bash
npm install
npm run dev
```

Demo mode can preview student pages without an API. Admin scheduling requires the authenticated backend.

## Backend integration

1. Follow [backend setup](./backend/README.md) to create the MySQL schema and start the API.
2. Copy `.env.example` to `.env`, set `VITE_API_BASE_URL=http://localhost:5000/api`, then restart Vite.
3. Register the administrator account and promote it in a trusted database session using the SQL in [backend setup](./backend/README.md).

The frontend stores the issued API token for protected requests. The admin role is enforced by the API, not only by frontend routes.

## Admin capabilities

- Review and approve/reject requests
- Generate continuous, conflict-free schedules prioritizing urgency, deadlines, and allocation fairness
- View daily/weekly schedules and manually move bookings
- Add personal research bookings
- Manage equipment and log/complete maintenance; overlapping bookings are rescheduled when possible

Run scheduler tests from `backend/` with `npm test`.
