'use strict';

const express = require('express');
const router  = express.Router();

const { register, login } = require('../controllers/authController');

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user
 * @access Public
 * @body   { name, email, password, role? }
 */
router.post('/register', register);

/**
 * @route  POST /api/auth/login
 * @desc   Authenticate user and return JWT
 * @access Public
 * @body   { email, password }
 */
router.post('/login', login);

module.exports = router;

