'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Buildings', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      address: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      city: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      country: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      numberOfFloors: {
        type:      Sequelize.INTEGER,
        allowNull: true,
      },
      description: {
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Buildings');
  },
};

