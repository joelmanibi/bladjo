'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// ─── BODY PARSERS ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── STATIC FILES ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Hotel ERP API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API ROUTES ──────────────────────────────────────────────────────────────
// Auth
app.use('/api/auth',       require('./routes/authRoutes'));
// Public website module
app.use('/api/public',     require('./routes/publicRoutes'));
// Users module
app.use('/api/users',      require('./modules/users/user.routes'));
// Hotel module
app.use('/api/rooms',      require('./routes/roomRoutes'));
app.use('/api/bookings',   require('./routes/bookingRoutes'));
// Apartment rental module
app.use('/api/apartments',   require('./modules/apartments/apartment.routes'));
app.use('/api/tenants',      require('./modules/tenants/tenant.routes'));
app.use('/api/leases',       require('./modules/leases/lease.routes'));
// Reception hall module
app.use('/api/halls',        require('./routes/hallRoutes'));
app.use('/api/hall-bookings', require('./routes/hallBookingRoutes'));
// Stock management module
app.use('/api/items',             require('./routes/itemRoutes'));
app.use('/api/purchase-requests', require('./routes/purchaseRequestRoutes'));
app.use('/api/stock-movements',   require('./routes/stockMovementRoutes'));
// Payroll module
app.use('/api/employees',         require('./routes/employeeRoutes'));
app.use('/api/salary-payments',   require('./routes/salaryPaymentRoutes'));
// Finance module
app.use('/api/payments',          require('./routes/paymentRoutes'));
// Dashboard
app.use('/api/dashboard',         require('./routes/dashboardRoutes'));
// Buildings module
app.use('/api/buildings',         require('./modules/buildings/building.routes'));
// Floors module
app.use('/api/floors',            require('./modules/floors/floor.routes'));
// Rent payments module
app.use('/api/rent-payments',     require('./modules/rent-payments/rentPayment.routes'));

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

