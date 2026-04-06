'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SalaryPayment extends Model {}

  SalaryPayment.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      employeeId: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: 'Employees', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'RESTRICT',
      },
      amount: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Amount must be a valid number' },
          min:       { args: [0], msg: 'Amount must be greater than or equal to 0' },
        },
      },
      // Format: YYYY-MM  (e.g. "2026-01")
      month: {
        type:      DataTypes.STRING(7),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Month is required' },
          is: {
            args: [/^[0-9]{4}-(0[1-9]|1[0-2])$/],
            msg: 'Month must be in YYYY-MM format (e.g. 2026-01)',
          },
        },
      },
      paymentDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'Payment date must be a valid date' },
        },
      },
    },
    {
      sequelize,
      modelName:  'SalaryPayment',
      tableName:  'SalaryPayments',
      timestamps: true,
    }
  );

  return SalaryPayment;
};

