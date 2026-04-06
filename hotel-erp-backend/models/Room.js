'use strict';

const { Model, DataTypes } = require('sequelize');

const ROOM_STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];

module.exports = (sequelize) => {
  class Room extends Model {}

  Room.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      roomNumber: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        unique:    true,
        validate: {
          notEmpty: { msg: 'Room number is required' },
        },
      },
      type: {
        type:      DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Room type is required' },
        },
      },
      price: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Price must be a valid number' },
          min:       { args: [0], msg: 'Price must be greater than or equal to 0' },
        },
      },
      status: {
        type:         DataTypes.ENUM(...ROOM_STATUSES),
        allowNull:    false,
        defaultValue: 'AVAILABLE',
        validate: {
          isIn: { args: [ROOM_STATUSES], msg: 'Invalid room status' },
        },
      },
      description: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
      imageUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },
      images: {
        type:      DataTypes.JSON,
        allowNull: true,
        comment:   'Array of image filenames stored in uploads/rooms/',
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
      modelName:  'Room',
      tableName:  'Rooms',
      timestamps: true,
    }
  );

  return Room;
};

module.exports.ROOM_STATUSES = ROOM_STATUSES;

