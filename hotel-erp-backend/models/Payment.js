'use strict';

const { Model, DataTypes } = require('sequelize');

const PAYMENT_METHODS  = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE'];
const REFERENCE_TYPES  = ['ROOM', 'HALL', 'APARTMENT', 'EXPENSE'];

module.exports = (sequelize) => {
  class Payment extends Model {}

  Payment.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      amount: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Amount must be a valid number' },
          min:       { args: [0.01], msg: 'Amount must be greater than 0' },
        },
      },
      paymentMethod: {
        type:      DataTypes.ENUM(...PAYMENT_METHODS),
        allowNull: false,
        validate: {
          isIn: { args: [PAYMENT_METHODS], msg: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` },
        },
      },
      paymentDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'Payment date must be a valid date' },
        },
      },
      referenceType: {
        type:      DataTypes.ENUM(...REFERENCE_TYPES),
        allowNull: false,
        validate: {
          isIn: { args: [REFERENCE_TYPES], msg: `Reference type must be one of: ${REFERENCE_TYPES.join(', ')}` },
        },
      },
      // Optional: id of the linked record (bookingId, leaseId, hallBookingId)
      // Null for EXPENSE payments or when no specific record is linked.
      referenceId: {
        type:      DataTypes.INTEGER,
        allowNull: true,
      },
      // Optional description — required context for EXPENSE, useful for all types.
      notes: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName:  'Payment',
      tableName:  'Payments',
      timestamps: true,
    }
  );

  return Payment;
};

module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.REFERENCE_TYPES = REFERENCE_TYPES;

