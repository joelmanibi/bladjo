'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      amount: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentMethod: {
        type:      Sequelize.ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE'),
        allowNull: false,
      },
      paymentDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      referenceType: {
        type:      Sequelize.ENUM('ROOM', 'HALL', 'APARTMENT', 'EXPENSE'),
        allowNull: false,
      },
      referenceId: {
        type:      Sequelize.INTEGER,
        allowNull: true,
      },
      notes: {
        type:      Sequelize.TEXT,
        allowNull: true,
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

    // Fast lookup by payment category (e.g. all EXPENSE payments)
    await queryInterface.addIndex('Payments', ['referenceType'], {
      name: 'payments_reference_type_index',
    });

    // Fast lookup by date range for financial reporting
    await queryInterface.addIndex('Payments', ['paymentDate'], {
      name: 'payments_payment_date_index',
    });

    // Composite index for filtering by type + date together
    await queryInterface.addIndex('Payments', ['referenceType', 'paymentDate'], {
      name: 'payments_reference_type_date_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  },
};

