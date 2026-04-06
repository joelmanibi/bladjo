'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Apartments', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      address: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      rentPrice: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type:         Sequelize.ENUM('FREE', 'OCCUPIED', 'MAINTENANCE'),
        allowNull:    false,
        defaultValue: 'FREE',
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

    await queryInterface.addIndex('Apartments', ['status'], {
      name: 'apartments_status_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Apartments');
  },
};

