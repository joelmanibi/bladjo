'use strict';

const { Model, DataTypes } = require('sequelize');

const HALL_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'];

module.exports = (sequelize) => {
  class HallBooking extends Model {}

  HallBooking.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      hallId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Halls', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
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
      startDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'Start date must be a valid date' },
        },
      },
      endDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'End date must be a valid date' },
          isAfterOrEqualStartDate(value) {
            if (new Date(value) < new Date(this.startDate)) {
              throw new Error('End date must be after or equal to start date');
            }
          },
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
      totalAmount: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Total amount must be a valid number' },
          min:       { args: [0], msg: 'Total amount must be greater than or equal to 0' },
        },
      },
      status: {
        type:         DataTypes.ENUM(...HALL_BOOKING_STATUSES),
        allowNull:    false,
        defaultValue: 'PENDING',
        validate: {
          isIn: { args: [HALL_BOOKING_STATUSES], msg: 'Invalid booking status' },
        },
      },
    },
    {
      sequelize,
      modelName:  'HallBooking',
      tableName:  'HallBookings',
      timestamps: true,
    }
  );

  return HallBooking;
};

module.exports.HALL_BOOKING_STATUSES = HALL_BOOKING_STATUSES;

