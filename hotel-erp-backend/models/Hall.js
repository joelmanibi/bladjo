'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Hall extends Model {}

  Hall.init(
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
          notEmpty: { msg: 'Hall name is required' },
          len:      { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      capacity: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'Capacity must be an integer' },
          min:   { args: [1], msg: 'Capacity must be at least 1' },
        },
      },
      pricePerDay: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Price per day must be a valid number' },
          min:       { args: [0], msg: 'Price per day must be greater than or equal to 0' },
        },
      },
      description: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
          const raw = this.getDataValue('images');
          if (!raw) return null;
          if (Array.isArray(raw)) return raw;
          try { return JSON.parse(raw); } catch (_) { return []; }
        },
      },
    },
    {
      sequelize,
      modelName:  'Hall',
      tableName:  'Halls',
      timestamps: true,
    }
  );

  return Hall;
};

