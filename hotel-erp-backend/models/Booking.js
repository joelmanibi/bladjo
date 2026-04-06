'use strict';

const { Model, DataTypes } = require('sequelize');

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

module.exports = (sequelize) => {
  class Booking extends Model {}

  Booking.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      roomId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Rooms',
          key:   'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      customerName: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Customer name is required' },
          len:      { args: [2, 100], msg: 'Customer name must be between 2 and 100 characters' },
        },
      },
      phone: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Phone number is required' },
        },
      },
      checkInDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'Check-in date must be a valid date' },
        },
      },
      checkOutDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'Check-out date must be a valid date' },
          isAfterCheckIn(value) {
            if (new Date(value) <= new Date(this.checkInDate)) {
              throw new Error('Check-out date must be after check-in date');
            }
          },
        },
      },
      totalAmount: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Total amount must be a valid number' },
          min:       { args: [0], msg: 'Total amount must be greater than or equal to 0' },
        },
      },
      advanceAmount: {
        type:         DataTypes.DECIMAL(10, 2),
        allowNull:    false,
        defaultValue: 0,
        validate: {
          isDecimal: { msg: 'Advance amount must be a valid number' },
          min:       { args: [0], msg: 'Advance amount must be greater than or equal to 0' },
        },
      },
      status: {
        type:         DataTypes.ENUM(...BOOKING_STATUSES),
        allowNull:    false,
        defaultValue: 'PENDING',
        validate: {
          isIn: { args: [BOOKING_STATUSES], msg: 'Invalid booking status' },
        },
      },
    },
    {
      sequelize,
      modelName:  'Booking',
      tableName:  'Bookings',
      timestamps: true,
    }
  );

  return Booking;
};

module.exports.BOOKING_STATUSES = BOOKING_STATUSES;

