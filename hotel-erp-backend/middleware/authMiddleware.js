'use strict';

const jwt      = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

// ─── protect ─────────────────────────────────────────────────────────────────
/**
 * Verify the Bearer JWT and attach the authenticated user to `req.user`.
 * Use this middleware on any route that requires authentication.
 *
 * @example
 *   router.get('/profile', protect, getProfile);
 */
const protect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    // Throws JsonWebTokenError / TokenExpiredError → caught by errorHandler
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm the user still exists in the database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── authorize ───────────────────────────────────────────────────────────────
/**
 * Role-based access control.
 * Must be used AFTER `protect`.
 *
 * @param {...string} roles - Allowed roles (e.g. 'ADMIN', 'MANAGER')
 *
 * @example
 *   router.delete('/users/:id', protect, authorize('ADMIN'), deleteUser);
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(
        `Role '${req.user.role}' is not authorized to access this resource`
      )
    );
  }
  next();
};

module.exports = { protect, authorize };

