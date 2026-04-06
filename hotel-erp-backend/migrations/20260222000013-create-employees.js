'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Employees', {
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
      phone: {
        type:      Sequelize.STRING(20),
        allowNull: false,
      },
      position: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      salary: {
        type:      Sequelize.DECIMAL(10, 2),
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

    await queryInterface.addIndex('Employees', ['position'], {
      name: 'employees_position_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Employees');
  },
};

