'use strict';

const { Booking, Room } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate number of nights between two DATEONLY strings. */
const calcNights = (checkIn, checkOut) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay);
};

/** Include the associated Room when fetching a Booking. */
const withRoom = { include: [{ model: Room, as: 'room' }] };

/**
 * Sync room.status when a booking status changes.
 * CONFIRMED  → room OCCUPIED
 * CANCELLED / COMPLETED → room AVAILABLE
 */
const syncRoomStatus = async (room, bookingStatus) => {
  if (bookingStatus === 'CONFIRMED') {
    await room.update({ status: 'OCCUPIED' });
  } else if (['CANCELLED', 'COMPLETED'].includes(bookingStatus)) {
    await room.update({ status: 'AVAILABLE' });
  }
};

// ─── GET /api/bookings ───────────────────────────────────────────────────────
const getAllBookings = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.roomId) where.roomId = req.query.roomId;

    const bookings = await Booking.findAll({
      where,
      ...withRoom,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(
      ApiResponse.success('Bookings fetched successfully', bookings, 200, { total: bookings.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/bookings/:id ───────────────────────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, withRoom);
    if (!booking) throw ApiError.notFound('Booking not found');

    res.status(200).json(ApiResponse.success('Booking fetched successfully', booking));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/bookings ──────────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { roomId, customerName, phone, checkInDate, checkOutDate, advanceAmount } = req.body;

    if (!roomId || !customerName || !phone || !checkInDate || !checkOutDate) {
      throw ApiError.badRequest('roomId, customerName, phone, checkInDate and checkOutDate are required');
    }

    const checkIn  = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn) || isNaN(checkOut)) throw ApiError.badRequest('Invalid date format');
    if (checkOut <= checkIn) throw ApiError.badRequest('checkOutDate must be after checkInDate');

    const room = await Room.findByPk(roomId);
    if (!room) throw ApiError.notFound('Room not found');
    if (room.status === 'OCCUPIED') {
      throw ApiError.badRequest('Room is currently occupied and cannot be booked');
    }

    const nights      = calcNights(checkInDate, checkOutDate);
    const totalAmount = parseFloat(room.price) * nights;

    const booking = await Booking.create({
      roomId,
      customerName,
      phone,
      checkInDate,
      checkOutDate,
      totalAmount,
      advanceAmount: advanceAmount || 0,
      status: 'PENDING',
    });

    const result = await Booking.findByPk(booking.id, withRoom);

    res.status(201).json(ApiResponse.created('Booking created successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/bookings/:id ───────────────────────────────────────────────────
const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, withRoom);
    if (!booking) throw ApiError.notFound('Booking not found');

    if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
      throw ApiError.badRequest(`Cannot update a booking with status "${booking.status}"`);
    }

    const { customerName, phone, checkInDate, checkOutDate, advanceAmount } = req.body;

    const newCheckIn  = checkInDate  || booking.checkInDate;
    const newCheckOut = checkOutDate || booking.checkOutDate;

    if (new Date(newCheckOut) <= new Date(newCheckIn)) {
      throw ApiError.badRequest('checkOutDate must be after checkInDate');
    }

    // Recalculate total if dates changed
    const nights      = calcNights(newCheckIn, newCheckOut);
    const totalAmount = parseFloat(booking.room.price) * nights;

    await booking.update({
      ...(customerName  !== undefined && { customerName  }),
      ...(phone         !== undefined && { phone         }),
      ...(checkInDate   !== undefined && { checkInDate   }),
      ...(checkOutDate  !== undefined && { checkOutDate  }),
      ...(advanceAmount !== undefined && { advanceAmount }),
      totalAmount,
    });

    const result = await Booking.findByPk(booking.id, withRoom);

    res.status(200).json(ApiResponse.success('Booking updated successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/bookings/:id/status ─────────────────────────────────────────
const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, withRoom);
    if (!booking) throw ApiError.notFound('Booking not found');

    const { status } = req.body;
    const VALID = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!status || !VALID.includes(status)) {
      throw ApiError.badRequest(`status must be one of: ${VALID.join(', ')}`);
    }

    await booking.update({ status });
    await syncRoomStatus(booking.room, status);

    const result = await Booking.findByPk(booking.id, withRoom);

    res.status(200).json(ApiResponse.success('Booking status updated successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/bookings/:id ────────────────────────────────────────────────
const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, withRoom);
    if (!booking) throw ApiError.notFound('Booking not found');

    if (booking.status === 'CONFIRMED') {
      throw ApiError.badRequest('Cannot delete a confirmed booking. Cancel it first.');
    }

    // Free the room if booking is pending
    if (booking.status === 'PENDING' && booking.room.status === 'OCCUPIED') {
      await booking.room.update({ status: 'AVAILABLE' });
    }

    await booking.destroy();

    res.status(200).json(ApiResponse.success('Booking deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
};

