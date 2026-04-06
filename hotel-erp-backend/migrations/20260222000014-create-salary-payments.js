'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SalaryPayments', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      employeeId: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'Employees', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'RESTRICT',
      },
      amount: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      month: {
        type:      Sequelize.STRING(7),
        allowNull: false,
      },
      paymentDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      createdAt: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
    });

    // Prevent paying the same employee twice for the same month
    await queryInterface.addIndex('SalaryPayments', ['employeeId', 'month'], {
      name:   'salary_payments_employee_month_unique',
      unique: true,
    });

    await queryInterface.addIndex('SalaryPayments', ['paymentDate'], {
      name: 'salary_payments_payment_date_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SalaryPayments');
  },
};

