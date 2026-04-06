'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Employee extends Model {}

  Employee.init(
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
          notEmpty: { msg: 'Employee name is required' },
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
      position: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Position is required' },
          len:      { args: [2, 100], msg: 'Position must be between 2 and 100 characters' },
        },
      },
      salary: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Salary must be a valid number' },
          min:       { args: [0], msg: 'Salary must be greater than or equal to 0' },
        },
      },
    },
    {
      sequelize,
      modelName:  'Employee',
      tableName:  'Employees',
      timestamps: true,
    }
  );

  return Employee;
};

