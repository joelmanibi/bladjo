'use strict';

/**
 * Custom application error class.
 *
 * @example
 *   throw new ApiError(404, 'Room not found');
 *   throw new ApiError(422, 'Validation failed', ['name is required']);
 */
class ApiError extends Error {
  /**
   * @param {number}   statusCode  - HTTP status code
   * @param {string}   message     - Human-readable error message
   * @param {string[]} [errors=[]] - Optional list of detail messages
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Static factory helpers ─────────────────────────────────────────────────
  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Validation failed', errors = []) {
    return new ApiError(422, message, errors);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;

