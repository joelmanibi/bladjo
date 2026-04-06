'use strict';

const { Op } = require('sequelize');
const { Booking, Hall, HallBooking, Room } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED'];
const withRoom = { include: [{ model: Room, as: 'room' }] };
const withHall = { include: [{ model: Hall, as: 'hall' }] };

const todayStr = () => new Date().toISOString().slice(0, 10);

const calcNights = (checkIn, checkOut) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay);
};

const calcInclusiveDays = (startDate, endDate) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(endDate) - new Date(startDate)) / msPerDay) + 1;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getReservedRoomDates = (bookings) => {
  const reserved = new Set();

  bookings.forEach((booking) => {
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    for (let current = new Date(start); current < end; current.setDate(current.getDate() + 1)) {
      reserved.add(toDateKey(current));
    }
  });

  return Array.from(reserved).sort();
};

const getReservedRoomRanges = (bookings) => (
  bookings.map((booking) => ({ startDate: booking.checkInDate, endDate: booking.checkOutDate }))
);

const getReservedHallDates = (bookings) => {
  const reserved = new Set();

  bookings.forEach((booking) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      reserved.add(toDateKey(current));
    }
  });

  return Array.from(reserved).sort();
};

const getReservedHallRanges = (bookings) => (
  bookings.map((booking) => ({ startDate: booking.startDate, endDate: booking.endDate }))
);

const hasRoomConflict = async (roomId, checkInDate, checkOutDate) => {
  const count = await Booking.count({
    where: {
      roomId,
      status: { [Op.in]: ACTIVE_BOOKING_STATUSES },
      checkInDate: { [Op.lt]: checkOutDate },
      checkOutDate: { [Op.gt]: checkInDate },
    },
  });

  return count > 0;
};

const hasHallConflict = async (hallId, startDate, endDate) => {
  const count = await HallBooking.count({
    where: {
      hallId,
      status: { [Op.in]: ACTIVE_BOOKING_STATUSES },
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate },
    },
  });

  return count > 0;
};

const getPublicRooms = async (req, res, next) => {
  try {
    const where = { status: 'AVAILABLE' };
    if (req.query.type) where.type = req.query.type;

    const rooms = await Room.findAll({
      where,
      order: [['price', 'ASC'], ['roomNumber', 'ASC']],
    });

    res.status(200).json(
      ApiResponse.success('Public rooms fetched successfully', rooms, 200, { total: rooms.length })
    );
  } catch (err) {
    next(err);
  }
};

const getPublicRoomById = async (req, res, next) => {
  try {
    const room = await Room.findOne({
      where: { id: req.params.id, status: 'AVAILABLE' },
      include: [{
        model: Booking,
        as: 'bookings',
        attributes: ['checkInDate', 'checkOutDate'],
        where: { status: { [Op.in]: ACTIVE_BOOKING_STATUSES } },
        required: false,
      }],
    });

    if (!room) throw ApiError.notFound('Room not found');

    const payload = room.toJSON();
    payload.reservedDates = getReservedRoomDates(payload.bookings || []);
    payload.reservedRanges = getReservedRoomRanges(payload.bookings || []);
    delete payload.bookings;

    res.status(200).json(ApiResponse.success('Public room fetched successfully', payload));
  } catch (err) {
    next(err);
  }
};

const createPublicRoomBooking = async (req, res, next) => {
  try {
    const { roomId, customerName, phone, checkInDate, checkOutDate, advanceAmount } = req.body;

    if (!roomId || !customerName || !phone || !checkInDate || !checkOutDate) {
      throw ApiError.badRequest('roomId, customerName, phone, checkInDate and checkOutDate are required');
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn) || isNaN(checkOut)) throw ApiError.badRequest('Invalid date format');
    if (checkOut <= checkIn) throw ApiError.badRequest('checkOutDate must be after checkInDate');
    if (checkInDate < todayStr()) throw ApiError.badRequest('checkInDate cannot be in the past');

    const room = await Room.findByPk(roomId);
    if (!room) throw ApiError.notFound('Room not found');
    if (room.status !== 'AVAILABLE') throw ApiError.badRequest('This room is not available for online booking');

    const conflict = await hasRoomConflict(roomId, checkInDate, checkOutDate);
    if (conflict) {
      throw ApiError.conflict('This room is already reserved for the selected dates');
    }

    const nights = calcNights(checkInDate, checkOutDate);
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
    res.status(201).json(ApiResponse.created('Room booking request sent successfully', result));
  } catch (err) {
    next(err);
  }
};

const getPublicHalls = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.minCapacity) {
      where.capacity = { [Op.gte]: Number(req.query.minCapacity) || 0 };
    }

    const halls = await Hall.findAll({
      where,
      order: [['capacity', 'ASC'], ['name', 'ASC']],
    });

    res.status(200).json(
      ApiResponse.success('Public halls fetched successfully', halls, 200, { total: halls.length })
    );
  } catch (err) {
    next(err);
  }
};

const getPublicHallById = async (req, res, next) => {
  try {
    const hall = await Hall.findByPk(req.params.id, {
      include: [{
        model: HallBooking,
        as: 'bookings',
        attributes: ['startDate', 'endDate'],
        where: { status: { [Op.in]: ACTIVE_BOOKING_STATUSES } },
        required: false,
      }],
    });

    if (!hall) throw ApiError.notFound('Hall not found');

    const payload = hall.toJSON();
    payload.reservedDates = getReservedHallDates(payload.bookings || []);
    payload.reservedRanges = getReservedHallRanges(payload.bookings || []);
    delete payload.bookings;

    res.status(200).json(ApiResponse.success('Public hall fetched successfully', payload));
  } catch (err) {
    next(err);
  }
};

const createPublicHallBooking = async (req, res, next) => {
  try {
    const { hallId, customerName, phone, startDate, endDate, advanceAmount } = req.body;

    if (!hallId || !customerName || !phone || !startDate || !endDate) {
      throw ApiError.badRequest('hallId, customerName, phone, startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) throw ApiError.badRequest('Invalid date format');
    if (end < start) throw ApiError.badRequest('endDate must be after or equal to startDate');
    if (startDate < todayStr()) throw ApiError.badRequest('startDate cannot be in the past');

    const hall = await Hall.findByPk(hallId);
    if (!hall) throw ApiError.notFound('Hall not found');

    const conflict = await hasHallConflict(hallId, startDate, endDate);
    if (conflict) {
      throw ApiError.conflict('This hall is already reserved during the selected period');
    }

    const booking = await HallBooking.create({
      hallId,
      customerName,
      phone,
      startDate,
      endDate,
      totalAmount: parseFloat(hall.pricePerDay) * calcInclusiveDays(startDate, endDate),
      advanceAmount: advanceAmount || 0,
      status: 'PENDING',
    });

    const result = await HallBooking.findByPk(booking.id, withHall);
    res.status(201).json(ApiResponse.created('Hall booking request sent successfully', result));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPublicHallBooking,
  createPublicRoomBooking,
  getPublicHallById,
  getPublicHalls,
  getPublicRoomById,
  getPublicRooms,
};