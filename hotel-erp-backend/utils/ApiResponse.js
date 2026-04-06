'use strict';

/**
 * Standardised API response helper.
 *
 * @example
 *   res.status(200).json(ApiResponse.success('Rooms fetched', rooms));
 *   res.status(201).json(ApiResponse.success('Room created', room, 201));
 */
class ApiResponse {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {*}      [data=null]
   * @param {object} [meta=null]  - Optional pagination / extra metadata
   */
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  // ── Static factory helpers ─────────────────────────────────────────────────
  static success(message = 'Success', data = null, statusCode = 200, meta = null) {
    return new ApiResponse(statusCode, message, data, meta);
  }

  static created(message = 'Created', data = null) {
    return new ApiResponse(201, message, data);
  }

  static noContent(message = 'No Content') {
    return new ApiResponse(204, message);
  }
}

module.exports = ApiResponse;

