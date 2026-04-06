'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Item extends Model {}

  Item.init(
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
          notEmpty: { msg: 'Item name is required' },
          len:      { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      category: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Category is required' },
        },
      },
      quantity: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
        validate: {
          isInt: { msg: 'Quantity must be an integer' },
          min:   { args: [0], msg: 'Quantity cannot be negative' },
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
    },
    {
      sequelize,
      modelName:  'Item',
      tableName:  'Items',
      timestamps: true,
    }
  );

  return Item;
};

