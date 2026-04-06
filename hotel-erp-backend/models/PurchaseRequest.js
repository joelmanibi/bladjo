'use strict';

const { Model, DataTypes } = require('sequelize');

const PR_STATUSES = ['PENDING', 'APPROVED', 'ORDERED', 'DELIVERED'];

module.exports = (sequelize) => {
  class PurchaseRequest extends Model {}

  PurchaseRequest.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      itemId: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: 'Items', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'RESTRICT',
      },
      quantity: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'Quantity must be an integer' },
          min:   { args: [1], msg: 'Quantity must be at least 1' },
        },
      },
      unitPrice: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Unit price must be a valid number' },
          min:       { args: [0], msg: 'Unit price must be greater than or equal to 0' },
        },
      },
      totalPrice: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Total price must be a valid number' },
          min:       { args: [0], msg: 'Total price must be greater than or equal to 0' },
        },
      },
      status: {
        type:         DataTypes.ENUM(...PR_STATUSES),
        allowNull:    false,
        defaultValue: 'PENDING',
        validate: {
          isIn: { args: [PR_STATUSES], msg: 'Invalid status' },
        },
      },
      receiptImage: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName:  'PurchaseRequest',
      tableName:  'PurchaseRequests',
      timestamps: true,
    }
  );

  return PurchaseRequest;
};

module.exports.PR_STATUSES = PR_STATUSES;

