'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Tenant extends Model {}

  Tenant.init(
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
          notEmpty: { msg: 'Tenant name is required' },
          len:      { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      phone: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Phone number is required' },
        },
      },
      email: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        unique:    true,
        set(value) {
          this.setDataValue('email', value ? value.toLowerCase().trim() : value);
        },
        validate: {
          isEmail:  { msg: 'Must be a valid email address' },
          notEmpty: { msg: 'Email is required' },
        },
      },
    },
    {
      sequelize,
      modelName:  'Tenant',
      tableName:  'Tenants',
      timestamps: true,
    }
  );

  return Tenant;
};

