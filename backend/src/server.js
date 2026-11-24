import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { pool } from './config/db.js';
import { requireAuth } from './middleware/authMiddleware.js';
import { errorHandler, httpError } from './utils/errors.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(httpError(403, 'Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res, next) => next(httpError(404, 'Route not found')));
app.use(errorHandler);

async function start() {
  await pool.query('SELECT 1');
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Backend startup failed:', error);
  process.exitCode = 1;
});

export default app;
