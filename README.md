# LabBook — Student Portal

Student-side frontend for the Lab Equipment Booking & Smart Scheduling System.

## Stack
- React + Vite
- React Router
- Bootstrap 5 + Bootstrap Icons
- Browser localStorage demo mode
- Optional Express API integration

## Run locally
1. Install Node.js (LTS).
2. Extract this folder and open it in VS Code.
3. Open a terminal in this folder:
   ```bash
   npm install
   npm run dev
   ```
4. Open the URL printed by Vite (usually http://localhost:5173).

## Demo mode
By default, the app uses localStorage and sample equipment. Register a student account, log in, submit booking requests, and view/cancel pending requests.

Demo mode is for frontend development only. It is not secure and does not provide real multi-user storage.

## Connect Member 2's backend
1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL=http://localhost:5000/api` (use the actual backend URL).
3. Restart `npm run dev`.

Expected API contract currently used by `src/services/api.js`:
- `POST /auth/register` — body: `{ name, email, studentId, department, password }`
- `POST /auth/login` — body: `{ email, password }`
- `GET /equipment` — returns an array of equipment.
- `GET /bookings/my` — returns the logged-in student's bookings.
- `POST /bookings` — body: `{ equipmentId, date, startTime, durationMinutes, deadline, urgency, purpose, userId }`
- `PATCH /bookings/:id/cancel` — cancels a pending booking.

Expected equipment fields: `id, name, category, description, status, location, icon`.
Expected booking fields: `id, equipmentId, equipmentName, date, startTime, durationMinutes, deadline, urgency, purpose, status`.

The backend team must confirm or adjust these endpoints and response shapes before integration. Authentication token handling may also need to be added once Member 2 finalizes the auth design.

## Team Git workflow
Work only on `feature/student-portal`. Do not push directly to `main`.
