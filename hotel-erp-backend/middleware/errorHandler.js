'use strict';

/**
 * Centralised error-handling middleware.
 * Must be registered LAST in app.js (after all routes).
 *
 * Usage — throw from any route/controller:
 *   const err = new Error('Not found');
 *   err.statusCode = 404;
 *   next(err);
 *
 *   — or use the ApiError helper in utils/ApiError.js
 */
const errorHandler = (err, _req, res, _next) => {
  // ── Determine status code ──────────────────────────────────────────────────
  let statusCode = err.statusCode || err.status || 500;

  // Sequelize validation error → 422 Unprocessable Entity
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 422;
  }

  // JWT errors → 401 Unauthorized
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
  }

  // ── Build the error message ────────────────────────────────────────────────
  let message = err.message || 'Internal Server Error';

  // Flatten Sequelize validation messages into an array
  let errors = null;
  if (err.errors && Array.isArray(err.errors)) {
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = 'Validation failed';
  }

  // ── Log in development ─────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] ${statusCode} — ${message}`);
    if (err.stack) console.error(err.stack);
  }

  // ── Send response ──────────────────────────────────────────────────────────
  const body = {
    success: false,
    statusCode,
    message,
    ...(errors && { errors }),
    // Expose stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(body);
};

module.exports = errorHandler;

