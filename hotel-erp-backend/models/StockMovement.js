'use strict';

const { Model, DataTypes } = require('sequelize');

const MOVEMENT_TYPES = ['IN', 'OUT'];

module.exports = (sequelize) => {
  class StockMovement extends Model {}

  StockMovement.init(
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
      type: {
        type:      DataTypes.ENUM(...MOVEMENT_TYPES),
        allowNull: false,
        validate: {
          isIn: { args: [MOVEMENT_TYPES], msg: 'Type must be IN or OUT' },
        },
      },
      reference: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Reference description is required' },
          len:      { args: [2, 255], msg: 'Reference must be between 2 and 255 characters' },
        },
      },
    },
    {
      sequelize,
      modelName:  'StockMovement',
      tableName:  'StockMovements',
      // Movements are an immutable audit log — only createdAt is needed
      createdAt:  true,
      updatedAt:  false,
    }
  );

  return StockMovement;
};

module.exports.MOVEMENT_TYPES = MOVEMENT_TYPES;

