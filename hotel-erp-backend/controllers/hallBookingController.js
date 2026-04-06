'use strict';

const { Op }      = require('sequelize');
const { HallBooking, Hall } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/** Include the associated Hall when fetching a HallBooking. */
const withHall = { include: [{ model: Hall, as: 'hall' }] };
const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const calcHallDays = (startDate, endDate) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(endDate) - new Date(startDate)) / msPerDay) + 1;
};

const normalizeAdvanceAmount = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const normalized = Number(value);
  if (Number.isNaN(normalized) || normalized < 0) {
    throw ApiError.badRequest('advanceAmount must be a number greater than or equal to 0');
  }
  return normalized;
};

/**
 * Check if a hall is already booked (PENDING or CONFIRMED) on the given period,
 * optionally excluding a specific booking (for updates).
 */
const hasConflict = async (hallId, startDate, endDate, excludeId = null) => {
  const where = {
    hallId,
    status: { [Op.in]: ACTIVE_STATUSES },
    startDate: { [Op.lte]: endDate },
    endDate: { [Op.gte]: startDate },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const count = await HallBooking.count({ where });
  return count > 0;
};

// ─── GET /api/hall-bookings ──────────────────────────────────────────────────
const getAllHallBookings = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.hallId) where.hallId = req.query.hallId;

    const bookings = await HallBooking.findAll({
      where,
      ...withHall,
      order: [['startDate', 'DESC'], ['endDate', 'DESC']],
    });

    res.status(200).json(
      ApiResponse.success('Hall bookings fetched successfully', bookings, 200, { total: bookings.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/hall-bookings/:id ──────────────────────────────────────────────
const getHallBookingById = async (req, res, next) => {
  try {
    const booking = await HallBooking.findByPk(req.params.id, withHall);
    if (!booking) throw ApiError.notFound('Hall booking not found');

    res.status(200).json(ApiResponse.success('Hall booking fetched successfully', booking));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/hall-bookings ─────────────────────────────────────────────────
const createHallBooking = async (req, res, next) => {
  try {
    const { hallId, customerName, phone, startDate, endDate, advanceAmount } = req.body;

    if (!hallId || !customerName || !phone || !startDate || !endDate) {
      throw ApiError.badRequest('hallId, customerName, phone, startDate, and endDate are required');
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      throw ApiError.badRequest('startDate and endDate must be valid dates');
    }

    if (new Date(endDate) < new Date(startDate)) {
      throw ApiError.badRequest('endDate must be after or equal to startDate');
    }

    const normalizedHallId = Number(hallId);
    if (!Number.isInteger(normalizedHallId) || normalizedHallId < 1) {
      throw ApiError.badRequest('hallId must be a valid integer');
    }

    const normalizedAdvanceAmount = normalizeAdvanceAmount(advanceAmount);

    const hall = await Hall.findByPk(normalizedHallId);
    if (!hall) throw ApiError.notFound('Hall not found');

    const conflict = await hasConflict(normalizedHallId, startDate, endDate);
    if (conflict) {
      throw ApiError.conflict('This hall is already booked during the selected period');
    }

    const totalAmount = parseFloat(hall.pricePerDay) * calcHallDays(startDate, endDate);

    const booking = await HallBooking.create({
      hallId: normalizedHallId,
      customerName,
      phone,
      startDate,
      endDate,
      totalAmount,
      advanceAmount: normalizedAdvanceAmount,
      status: 'PENDING',
    });

    const result = await HallBooking.findByPk(booking.id, withHall);

    res.status(201).json(ApiResponse.created('Hall booking created successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/hall-bookings/:id ──────────────────────────────────────────────
const updateHallBooking = async (req, res, next) => {
  try {
    const booking = await HallBooking.findByPk(req.params.id, withHall);
    if (!booking) throw ApiError.notFound('Hall booking not found');

    if (booking.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot update a cancelled booking');
    }

    const { hallId, customerName, phone, startDate, endDate, advanceAmount } = req.body;

    const newStartDate = startDate || booking.startDate;
    const newEndDate = endDate || booking.endDate;
    const newHallId = hallId !== undefined ? Number(hallId) : booking.hallId;

    if (!isValidDate(newStartDate) || !isValidDate(newEndDate)) {
      throw ApiError.badRequest('startDate and endDate must be valid dates');
    }

    if (new Date(newEndDate) < new Date(newStartDate)) {
      throw ApiError.badRequest('endDate must be after or equal to startDate');
    }

    if (!Number.isInteger(newHallId) || newHallId < 1) {
      throw ApiError.badRequest('hallId must be a valid integer');
    }

    const normalizedAdvanceAmount = advanceAmount !== undefined
      ? normalizeAdvanceAmount(advanceAmount)
      : booking.advanceAmount;

    let hall = booking.hall;
    if (hallId !== undefined) {
      hall = await Hall.findByPk(newHallId);
      if (!hall) throw ApiError.notFound('Hall not found');
    }

    if (
      hallId !== undefined ||
      (startDate && startDate !== booking.startDate) ||
      (endDate && endDate !== booking.endDate)
    ) {
      const conflict = await hasConflict(newHallId, newStartDate, newEndDate, booking.id);
      if (conflict) {
        throw ApiError.conflict('This hall is already booked during the selected period');
      }
    }

    const totalAmount = parseFloat(hall.pricePerDay) * calcHallDays(newStartDate, newEndDate);

    await booking.update({
      ...(hallId        !== undefined && { hallId: newHallId }),
      ...(customerName  !== undefined && { customerName  }),
      ...(phone         !== undefined && { phone         }),
      ...(startDate     !== undefined && { startDate     }),
      ...(endDate       !== undefined && { endDate       }),
      ...(advanceAmount !== undefined && { advanceAmount: normalizedAdvanceAmount }),
      totalAmount,
    });

    const result = await HallBooking.findByPk(booking.id, withHall);

    res.status(200).json(ApiResponse.success('Hall booking updated successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/hall-bookings/:id/status ────────────────────────────────────
const updateHallBookingStatus = async (req, res, next) => {
  try {
    const booking = await HallBooking.findByPk(req.params.id, withHall);
    if (!booking) throw ApiError.notFound('Hall booking not found');

    const { status } = req.body;
    const VALID = ['PENDING', 'CONFIRMED', 'CANCELLED'];
    if (!status || !VALID.includes(status)) {
      throw ApiError.badRequest(`status must be one of: ${VALID.join(', ')}`);
    }

    await booking.update({ status });

    const result = await HallBooking.findByPk(booking.id, withHall);

    res.status(200).json(ApiResponse.success('Hall booking status updated successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/hall-bookings/:id ───────────────────────────────────────────
const deleteHallBooking = async (req, res, next) => {
  try {
    const booking = await HallBooking.findByPk(req.params.id);
    if (!booking) throw ApiError.notFound('Hall booking not found');

    if (booking.status === 'CONFIRMED') {
      throw ApiError.badRequest('Cannot delete a confirmed booking. Cancel it first.');
    }

    await booking.destroy();

    res.status(200).json(ApiResponse.success('Hall booking deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllHallBookings,
  getHallBookingById,
  createHallBooking,
  updateHallBooking,
  updateHallBookingStatus,
  deleteHallBooking,
};

