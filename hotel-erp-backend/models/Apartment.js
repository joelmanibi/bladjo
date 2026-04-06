'use strict';

const { Model, DataTypes } = require('sequelize');

const APARTMENT_STATUSES = ['FREE', 'OCCUPIED', 'MAINTENANCE'];

module.exports = (sequelize) => {
  class Apartment extends Model {}

  Apartment.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Apartment name is required' },
          len:      { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      address: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Address is required' },
        },
      },
      rentPrice: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Rent price must be a valid number' },
          min:       { args: [0], msg: 'Rent price must be greater than or equal to 0' },
        },
      },
      status: {
        type:         DataTypes.ENUM(...APARTMENT_STATUSES),
        allowNull:    false,
        defaultValue: 'FREE',
        validate: {
          isIn: { args: [APARTMENT_STATUSES], msg: 'Invalid apartment status' },
        },
      },
    },
    {
      sequelize,
      modelName:  'Apartment',
      tableName:  'Apartments',
      timestamps: true,
    }
  );

  return Apartment;
};

module.exports.APARTMENT_STATUSES = APARTMENT_STATUSES;

