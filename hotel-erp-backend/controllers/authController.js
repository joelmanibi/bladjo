'use strict';

const jwt      = require('jsonwebtoken');
const { User } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sign a JWT access token for the given payload.
 * @param {{ id: number, role: string }} payload
 * @returns {string}
 */
const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── POST /api/auth/register ─────────────────────────────────────────────────

/**
 * Register a new user.
 * Body: { name, email, password, role? }
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic presence validation
    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email and password are required');
    }

    // Check for duplicate email
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      throw ApiError.conflict('Email is already registered');
    }

    // Create user — password is hashed automatically by the model's beforeCreate hook
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      role:     role || 'RECEPTIONIST',
    });

    const token = generateToken({ id: user.id, role: user.role });

    return res.status(201).json(
      ApiResponse.created('User registered successfully', {
        token,
        user: user.toSafeObject(),
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

/**
 * Authenticate an existing user.
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    // Use the same generic message to prevent user-enumeration
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json(
      ApiResponse.success('Login successful', {
        token,
        user: user.toSafeObject(),
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };

