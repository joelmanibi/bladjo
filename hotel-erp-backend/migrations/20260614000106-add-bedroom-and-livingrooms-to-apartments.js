'use strict';

/**
 * Migration: add bedroom and living room counts to Apartments.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Apartments', 'bedrooms', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Apartments', 'livingRooms', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Apartments', 'livingRooms');
    await queryInterface.removeColumn('Apartments', 'bedrooms');
  },
};