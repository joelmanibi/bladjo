'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Lease extends Model {
    /** Returns true when today falls within [startDate, endDate]. */
    isActive() {
      const today = new Date();
      return new Date(this.startDate) <= today && today <= new Date(this.endDate);
    }
  }

  Lease.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      apartmentId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Apartments', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
      },
      tenantId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
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
          isAfterStart(value) {
            if (new Date(value) <= new Date(this.startDate)) {
              throw new Error('End date must be after start date');
            }
          },
        },
      },
      monthlyRent: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Monthly rent must be a valid number' },
          min:       { args: [0], msg: 'Monthly rent must be greater than or equal to 0' },
        },
      },
    },
    {
      sequelize,
      modelName:  'Lease',
      tableName:  'Leases',
      timestamps: true,
    }
  );

  return Lease;
};

